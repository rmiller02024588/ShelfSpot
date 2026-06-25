import AntDesign from '@expo/vector-icons/AntDesign';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getCurrentUser } from '../lib/auth';
import { supabase } from '../Supabaseconfig';

type PostCardProps = {
    author: string;
    item: string;
    description: string;
    address: string;
    image: string;
    time: string;
    postId: string;
};

const COLORS = {
    background: '#FAF7F2',
    card: '#FFFFFF',
    accent: '#C0784A',
    accentLight: '#F5EDE4',
    text: '#2C1A0E',
    textSecondary: '#8C7B6E',
    border: '#E8DDD4',
    inputBg: '#FDF9F5',
};

export default function MinPostCard({ author, item, description, address, image, time, postId }: PostCardProps) {
    const [saved, setSaved] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let channel: ReturnType<typeof supabase.channel> | null = null;

        const setup = async () => {
            const user = await getCurrentUser();
            if (!user) return;

            const checkSaved = async () => {
                const { data } = await supabase
                    .from('saved_posts')
                    .select('post_id')
                    .eq('user_id', user.id)
                    .eq('post_id', postId)
                    .maybeSingle();
                setSaved(!!data);
            };

            await checkSaved();

            channel = supabase
                .channel(`min-saved-post-${user.id}-${postId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'saved_posts',
                    filter: `user_id=eq.${user.id}`,
                }, () => checkSaved())
                .subscribe();
        };

        setup();
        return () => { if (channel) supabase.removeChannel(channel); };
    }, [postId]);

    const toggleExpanded = () => {
        if (!expanded) {
            setExpanded(true);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.timing(rotateAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
                Animated.timing(rotateAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
            ]).start(() => {
                setExpanded(false);
            });
        }
    };

    const chevronRotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    const handleSavePress = async () => {
        const user = await getCurrentUser();
        if (!user) return;
        const newSavedState = !saved;
        setSaved(newSavedState);
        try {
            if (newSavedState) {
                await savePost(user.id, postId);
            } else {
                await unsavePost(user.id, postId);
            }
            const { data } = await supabase
                .from('saved_posts')
                .select('post_id')
                .eq('user_id', user.id)
                .eq('post_id', postId)
                .maybeSingle();
            setSaved(!!data);
        } catch (err) {
            setSaved(!newSavedState);
            console.error('Error saving/unsaving post:', err);
        }
    };

    const initials = (author || '??')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <View style={styles.card}>
            <View style={styles.minRow}>
                <View style={styles.minInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>{item}</Text>
                    <View style={styles.metaRow}>
                        {time ? (
                            <View style={styles.metaChip}>
                                <AntDesign name="clock-circle" size={11} color={COLORS.textSecondary} />
                                <Text style={styles.metaText}>{time}</Text>
                            </View>
                        ) : null}
                        {address ? (
                            <View style={styles.metaChip}>
                                <AntDesign name="pushpin" size={11} color={COLORS.textSecondary} />
                                <Text style={styles.metaText} numberOfLines={1}>{address}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                <TouchableOpacity
                    onPress={toggleExpanded}
                    style={styles.expandButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Text style={styles.expandLabel}>{expanded ? 'Less' : 'More'}</Text>
                    <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
                        <AntDesign name="down" size={12} color={COLORS.accent} />
                    </Animated.View>
                </TouchableOpacity>
            </View>

            {expanded && (
                <Animated.View style={[styles.expandedContent, { opacity: fadeAnim }]}>
                    <View style={styles.divider} />
                    {image ? (
                        <Image source={{ uri: image }} style={styles.image} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <AntDesign name="picture" size={32} color={COLORS.textSecondary} />
                        </View>
                    )}

                    <View style={styles.body}>
                        <View style={styles.authorRow}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{initials}</Text>
                            </View>
                            <View style={styles.authorInfo}>
                                <Text style={styles.authorName}>{author}</Text>
                                <Text style={styles.timeText}>{time}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={handleSavePress}
                                style={styles.saveButton}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <AntDesign
                                    name="heart"
                                    size={18}
                                    color={saved ? COLORS.accent : COLORS.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                        {description ? (
                            <Text style={styles.description}>{description}</Text>
                        ) : null}

                        {address ? (
                            <View style={styles.locationRow}>
                                <AntDesign name="pushpin" size={12} color={COLORS.textSecondary} />
                                <Text style={styles.locationText} numberOfLines={1}>{address}</Text>
                            </View>
                        ) : null}
                    </View>
                </Animated.View>
            )}
        </View>
    );
}

const savePost = async (userId: string, postId: string) => {
    await supabase.from('saved_posts').insert({ user_id: userId, post_id: postId });
};

const unsavePost = async (userId: string, postId: string) => {
    await supabase.from('saved_posts').delete().eq('user_id', userId).eq('post_id', postId);
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        overflow: 'hidden',
        shadowColor: '#C0784A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },

    minRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 8,
    },
    minInfo: {
        flex: 1,
        gap: 4,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.accentLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    expandLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.accent,
    },

    expandedContent: {
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginHorizontal: 14,
    },
    image: {
        width: '100%',
        height: 400,
    },
    imagePlaceholder: {
        width: '100%',
        height: 140,
        backgroundColor: COLORS.accentLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    body: {
        padding: 14,
        gap: 6,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: COLORS.accentLight,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.accent,
    },
    authorInfo: {
        flex: 1,
    },
    authorName: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
    },
    timeText: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginTop: 1,
    },
    saveButton: {
        padding: 4,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        letterSpacing: -0.2,
    },
    description: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    locationText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        flex: 1,
    },
});
