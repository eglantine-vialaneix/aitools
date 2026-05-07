import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

from sklearn.preprocessing import OneHotEncoder
from sklearn.tree import DecisionTreeClassifier

RANDOM_STATE = 15


### ---------------------- GINI IMPURITY ----------------------- ####

def gini_impurity(df_yes:pd.DataFrame, df_no:pd.DataFrame):
    A = df_yes[df_yes["régime_alimentaire"] == "herbivore"].shape[0]
    B = df_yes[df_yes["régime_alimentaire"] == "carnivore"].shape[0]
    C = df_no[df_no["régime_alimentaire"] == "herbivore"].shape[0]
    D = df_no[df_no["régime_alimentaire"] == "carnivore"].shape[0]
    if A + B == 0 or C + D == 0:
        return float("inf")
    else:
        return ((A * B) / (A + B)) + ((C * D) / (C + D))



def _compute_all_ginis(df:pd.DataFrame, feature:str):
    x = df[feature].sort_values().unique()
    y = []
    
    if df[feature].dtype == 'float64' or df[feature].dtype == 'int':
        for l in x:
            mask = df[feature] >= l
            y.append(gini_impurity(df[mask], df[~mask]))
        return x, y
    elif df[feature].dtype == 'bool' or df[feature].dtype == 'str':
        for cat in x:
            mask = df[feature] == cat
            y.append(gini_impurity(df[mask], df[~mask]))
        return x, y
    else:
        raise TypeError(f"The type {df[feature].dtype} of the feature {feature} is not supported.")



def plot_gini_all_features(df, 
                           features = ['période', 'habitat', 'type', 'bipède',
                                       'longueur (m)', 'poids (kg)', 'nommé_par', 'espèce',
                                       'sous-ordre_taxonomique', 'famille_taxonomique'],
                           sharey = True):
    
    _, axes = plt.subplots(1, len(features), figsize=(30, 3), sharey=sharey, width_ratios=[1, 1, 1, 0.5, 1, 1, 1.5, 1.5, 0.5, 1.5])

    all_ginis = {}
    best_ginis = {}
    worst_ginis = {}
    for i, feature in enumerate(features):
        x, y = _compute_all_ginis(df, feature)
        axes[i].scatter(x, y)
        axes[i].set_title(feature)
        axes[i].set_ylabel("")
        axes[i].tick_params(labelrotation=90)
        
        if feature == "poids (kg)":
            axes[i].set_xscale("log")
        
        all_ginis[feature] = {xi : yi for xi, yi in zip(x, y)}
        best_ginis[feature] = {x[np.argmin(y)]: min(y)}
        worst_ginis[feature] = {x[np.argmax(y)]: max(y)}


    axes[0].set_ylabel("Gini Impurity")
    plt.show()
    
    return all_ginis, best_ginis, worst_ginis


### ---------------------- TREE COMPUTATION ----------------------- ####

def branch(df:pd.DataFrame, feature:str, criteria:str):
    """Split the df into the 2 resulting df -> df_yes and df_no based on specified feature and criteria/threshold.

    Args:
        df (pd.DataFrame): the data
        feature (str): column/feature to split the data on (eg: "bipède")
        criteria (str): the threshold/criteria to split the data (eg: "<= 0.5")

    Returns:
        df_yes, df_no: left and right branches of the tree node
    """
    
    df_yes = eval(f"df[df['{feature}']{criteria}]")
    df_no = eval(f"df[~df['{feature}']{criteria}]")
    
    return df_yes, df_no


def train_BB_tree(df_train:pd.DataFrame, features:list):
    
    X = df_train.drop(columns="régime_alimentaire")
    y = df_train["régime_alimentaire"]

    # One hot encoding categorical variables
    ohe = OneHotEncoder(handle_unknown="ignore") # to handle cases where we might get unseen categories during test
    X = ohe.fit_transform(X)

    tree = DecisionTreeClassifier(criterion="gini",
                                max_depth=3,
                                random_state=RANDOM_STATE)

    tree.fit(X, y)
    
    return ... # TODO: return df_pred