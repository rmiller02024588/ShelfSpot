import pandas as pd
import matplotlib.pyplot as plt
import os

charts_dir = os.path.join(os.path.dirname(__file__), "charts")
os.makedirs(charts_dir, exist_ok=True)

# Chart 1: User Satisfaction
satisfaction = pd.DataFrame({
    "count": [87, 13]
}, index=["satisfied", "not satisfied"])

satisfaction["count"].plot(kind="bar", color=["green", "red"], rot=0)
plt.title("User Satisfaction")
plt.ylabel("Responses")
plt.tight_layout()
plt.savefig(os.path.join(charts_dir, "satisfaction_chart.png"))
plt.clf()

# Chart 2: Item Accuracy
accuracy = pd.DataFrame({
    "count": [74, 26]
}, index=["found it", "not found"])

accuracy["count"].plot(kind="bar", color=["blue", "red"], rot=0)
plt.title("Item Accuracy")
plt.ylabel("Reports")
plt.tight_layout()
plt.savefig(os.path.join(charts_dir, "accuracy_chart.png"))
plt.clf()

# Chart 3: Usage Frequency
usage = pd.DataFrame({
    "count": [5, 12, 34, 28, 21]
}, index=["Never", "Once", "Occasionally", "Weekly", "More than once a week"])

usage["count"].plot(kind="bar", color="steelblue", rot=15)
plt.title("How often do you use ShelfSpot?")
plt.ylabel("Responses")
plt.tight_layout()
plt.savefig(os.path.join(charts_dir, "usage_frequency_chart.png"))
plt.clf()

# Chart 4: Rate Experience
experience = pd.DataFrame({
    "Creating a Post":               [5, 10, 20, 35, 30],
    "Searching for a Specific Item": [8, 15, 25, 30, 22],
    "Finding Item in Right Location":[12, 18, 22, 28, 20],
}, index=["Extremely Dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Extremely Satisfied"])

experience.plot(kind="line", marker="o")
plt.title("User Experience by Action")
plt.ylabel("Responses")
plt.xticks(range(5), experience.index, rotation=15)
plt.tight_layout()
plt.savefig(os.path.join(charts_dir, "experience_chart.png"))
plt.clf()

print("Charts saved to", charts_dir)