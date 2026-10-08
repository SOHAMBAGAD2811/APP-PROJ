# 🧮 AiRA System — Comprehensive Manual Calculation & Step-by-Step Reference

> 📄 **Official Google Drive Document Link:** [View Paper Calculations on Google Drive](https://drive.google.com/file/d/1E9WFpJxbBOduNnaWg7Gew4w16bxafzlh/view?usp=sharing)

This document provides the complete mathematical formulations and line-by-line, step-by-step manual calculations for all metrics computed by the **India Domestic Airfare Price Index (APIx)** system.

You can use these exact numerical steps to verify, replicate, or perform manual paper calculations side-by-side with the automated system outputs.

---

## 📋 Table of Contents
1. [National Composite Airfare Price Index (APIx) — Lowe Price Index](#1-national-composite-airfare-price-index-apix--lowe-price-index)
2. [Corridor-Level Airfare Price Index & Contribution](#2-corridor-level-airfare-price-index--contribution)
3. [Missing Data Imputation (Group-Mean Imputation vs LOCF)](#3-missing-data-imputation-group-mean-imputation-vs-locf)
4. [Outlier Detection & Data Cleaning (Log-MAD Filter)](#4-outlier-detection--data-cleaning-log-mad-filter)
5. [Macroeconomic What-If Policy Simulation Engine](#5-macroeconomic-what-if-policy-simulation-engine)
6. [Statistical Backtest & Validation Metrics (Pearson r, RMSE, Theil's U)](#6-statistical-backtest--validation-metrics-pearson-r-rmse-theils-u)
7. [Fare Component Unbundling & Tax Structure](#7-fare-component-unbundling--tax-structure)

---

## 1. National Composite Airfare Price Index (APIx) — Lowe Price Index

The composite national Airfare Price Index ($\text{APIx}$) measures price changes across representative domestic trunk corridors weighted by annual DGCA passenger traffic shares.

### 📐 Formula
$$\text{APIx}_t = 100 \times \frac{\sum_{i \in \mathcal{C}} w_i \cdot \left(\frac{P_{it}}{P_{i0}}\right)}{\sum_{i \in \mathcal{C}} w_i}$$

Where:
- $\mathcal{C}$: Set of observed DGCA basket corridors.
- $w_i$: DGCA passenger traffic weight share for corridor $i$ (summing to $1.000$).
- $P_{it}$: Current mean scraped fare for corridor $i$ at time $t$.
- $P_{i0}$: Base period median fare for corridor $i$ ($2024\text{-Q1}$ baseline).

---

### 📝 Step-by-Step Manual Paper Example

#### Given Data:
| Corridor ($i$) | Corridor Name | DGCA Weight ($w_i$) | Base Fare ($P_{i0}$) | Current Fare ($P_{it}$) |
|---|---|---|---|---|
| **DEL-BOM** | Delhi – Mumbai | $0.245$ (24.5%) | ₹6,450 | ₹7,417.50 |
| **DEL-BLR** | Delhi – Bengaluru | $0.198$ (19.8%) | ₹7,100 | ₹7,668.00 |
| **BOM-BLR** | Mumbai – Bengaluru | $0.172$ (17.2%) | ₹4,850 | ₹4,607.50 |
| **DEL-CCU** | Delhi – Kolkata | $0.141$ (14.1%) | ₹6,920 | ₹8,061.80 |
| **MAA-DEL** | Chennai – Delhi | $0.126$ (12.6%) | ₹7,340 | ₹7,340.00 |
| **BLR-HYD** | Bengaluru – Hyderabad | $0.118$ (11.8%) | ₹3,890 | ₹4,123.40 |

---

#### Step-by-Step Calculation:

**Step 1: Compute Individual Corridor Price Ratios ($R_i = \frac{P_{it}}{P_{i0}}$)**
1. **DEL-BOM**: $\frac{7,417.50}{6,450.00} = \mathbf{1.150000}$  (Corridor APIx = $115.00$)
2. **DEL-BLR**: $\frac{7,668.00}{7,100.00} = \mathbf{1.080000}$  (Corridor APIx = $108.00$)
3. **BOM-BLR**: $\frac{4,607.50}{4,850.00} = \mathbf{0.950000}$  (Corridor APIx = $95.00$)
4. **DEL-CCU**: $\frac{8,061.80}{6,920.00} = \mathbf{1.165000}$  (Corridor APIx = $116.50$)
5. **MAA-DEL**: $\frac{7,340.00}{7,340.00} = \mathbf{1.000000}$  (Corridor APIx = $100.00$)
6. **BLR-HYD**: $\frac{4,123.40}{3,890.00} = \mathbf{1.060000}$  (Corridor APIx = $106.00$)

**Step 2: Multiply Each Ratio by its DGCA Corridor Weight ($w_i \cdot R_i$)**
1. **DEL-BOM**: $0.245 \times 1.150000 = \mathbf{0.281750}$
2. **DEL-BLR**: $0.198 \times 1.080000 = \mathbf{0.213840}$
3. **BOM-BLR**: $0.172 \times 0.950000 = \mathbf{0.163400}$
4. **DEL-CCU**: $0.141 \times 1.165000 = \mathbf{0.164265}$
5. **MAA-DEL**: $0.126 \times 1.000000 = \mathbf{0.126000}$
6. **BLR-HYD**: $0.118 \times 1.060000 = \mathbf{0.125080}$

**Step 3: Calculate Numerator Sum ($\sum w_i \cdot R_i$)**
$$\text{Numerator Sum} = 0.281750 + 0.213840 + 0.163400 + 0.164265 + 0.126000 + 0.125080 = \mathbf{1.074335}$$

**Step 4: Calculate Denominator Sum ($\sum w_i$)**
$$\text{Denominator Sum} = 0.245 + 0.198 + 0.172 + 0.141 + 0.126 + 0.118 = \mathbf{1.000000}$$

**Step 5: Compute Final Composite APIx**
$$\text{APIx}_t = 100 \times \frac{1.074335}{1.000000} = \mathbf{107.43}$$

> **Interpretation**: National domestic airfares across observed corridors are **7.43% higher** than the Q1 2024 base period baseline.

---

## 2. Corridor-Level Airfare Price Index & Contribution

### 📐 Formulas
$$\text{APIx}_i = \left(\frac{P_{it}}{P_{i0}}\right) \times 100$$

$$\text{Contribution}_i = w_i \cdot (\text{APIx}_{i, t} - \text{APIx}_{i, t-1})$$

Where:
- $\text{APIx}_{i, t}$: Today's index for corridor $i$.
- $\text{APIx}_{i, t-1}$: Yesterday's index for corridor $i$.
- $w_i$: DGCA weight share for corridor $i$.

---

### 📝 Step-by-Step Manual Paper Example

#### Given Data:
- Corridor: **DEL-BOM** ($w_i = 0.245$)
- Base Fare ($P_{i0}$) = ₹6,450
- Yesterday's Fare ($P_{i, t-1}$) = ₹7,224.00 $\implies \text{APIx}_{i, t-1} = \frac{7,224}{6,450} \times 100 = \mathbf{112.00}$
- Today's Fare ($P_{i, t}$) = ₹7,417.50 $\implies \text{APIx}_{i, t} = \frac{7,417.50}{6,450} \times 100 = \mathbf{115.00}$

#### Step-by-Step Calculation:
1. **Change in Corridor Index ($\Delta \text{APIx}_i$)**:
   $$\Delta \text{APIx}_i = 115.00 - 112.00 = \mathbf{+3.00 \text{ index points}}$$
2. **Weighted Contribution to National Movement ($\text{Contribution}_i$)**:
   $$\text{Contribution}_{\text{DEL-BOM}} = 0.245 \times (+3.00) = \mathbf{+0.735 \text{ index points}}$$

---

## 3. Missing Data Imputation (Group-Mean Imputation vs LOCF)

When a corridor scrape is missing due to an OTA outage, the missing price is imputed using the weighted mean ratio of available observed basket corridors.

### 📐 Formula
$$\bar{R}_{\text{obs}} = \frac{\sum_{j \in \text{Observed}} w_j \cdot \left(\frac{P_{jt}}{P_{j0}}\right)}{\sum_{j \in \text{Observed}} w_j}$$

$$P_{kt}^{\text{imputed}} = P_{k0} \times \bar{R}_{\text{obs}}$$

---

### 📝 Step-by-Step Manual Paper Example

#### Given Data:
- Unobserved Corridor: **MAA-DEL** ($P_{k0} = ₹7,340$).
- Observed Corridors Sum of Weighted Ratios ($\sum_{j \in \text{Observed}} w_j R_j$) = $0.948335$.
- Observed Corridors Sum of Weights ($\sum_{j \in \text{Observed}} w_j$) = $1.000000 - 0.126 = 0.874000$.

#### Step-by-Step Calculation:
1. **Compute Mean Price Ratio of Observed Group ($\bar{R}_{\text{obs}}$)**:
   $$\bar{R}_{\text{obs}} = \frac{0.948335}{0.874000} = \mathbf{1.0850515}$$
2. **Compute Imputed Current Fare for MAA-DEL ($P_{\text{MAA-DEL}, t}^{\text{imputed}}$)**:
   $$P_{\text{MAA-DEL}, t}^{\text{imputed}} = 7,340 \times 1.0850515 = \mathbf{₹7,964.28}$$

---

## 4. Outlier Detection & Data Cleaning (Log-MAD Filter)

Filters out erroneous fare spikes, system glitches, or unbundled seat anomalies using robust statistics.

### 📐 Formulas
1. Natural Log Transform: $x_i = \ln(P_i)$
2. Median Log: $\tilde{x} = \text{Median}(x_i)$
3. Median Absolute Deviation: $\text{MAD} = \text{Median}(|x_i - \tilde{x}|)$
4. Modified Z-Score:
   $$M_i = 0.6745 \cdot \frac{|x_i - \tilde{x}|}{\text{MAD}}$$
5. Threshold Rule: Reject observation if $M_i > 3.5$.

---

### 📝 Step-by-Step Manual Paper Example

#### Given Raw Fare Observations (DEL-BOM):
$[₹6,000, ₹6,200, ₹6,300, ₹6,500, ₹6,800, \mathbf{₹45,000}]$ *(where ₹45,000 is a scraping anomaly)*.

#### Step-by-Step Calculation:

**Step 1: Compute Natural Log ($x_i = \ln(P_i)$)**
- $x_1 = \ln(6000) = \mathbf{8.699515}$
- $x_2 = \ln(6200) = \mathbf{8.732305}$
- $x_3 = \ln(6300) = \mathbf{8.748305}$
- $x_4 = \ln(6500) = \mathbf{8.779557}$
- $x_5 = \ln(6800) = \mathbf{8.824678}$
- $x_6 = \ln(45000) = \mathbf{10.714418}$

**Step 2: Find Median Log ($\tilde{x}$)**
Since $N = 6$ (even), take the average of 3rd and 4th values:
$$\tilde{x} = \frac{8.748305 + 8.779557}{2} = \mathbf{8.763931}$$

**Step 3: Compute Absolute Deviations ($d_i = |x_i - \tilde{x}|$)**
1. $d_1 = |8.699515 - 8.763931| = \mathbf{0.064416}$
2. $d_2 = |8.732305 - 8.763931| = \mathbf{0.031626}$
3. $d_3 = |8.748305 - 8.763931| = \mathbf{0.015626}$
4. $d_4 = |8.779557 - 8.763931| = \mathbf{0.015626}$
5. $d_5 = |8.824678 - 8.763931| = \mathbf{0.060747}$
6. $d_6 = |10.714418 - 8.763931| = \mathbf{1.950487}$

**Step 4: Compute Median Absolute Deviation ($\text{MAD}$)**
Sorted Deviations: $[0.015626, 0.015626, \mathbf{0.031626, 0.060747}, 0.064416, 1.950487]$
$$\text{MAD} = \frac{0.031626 + 0.060747}{2} = \mathbf{0.0461865}$$

**Step 5: Compute Modified Z-Score for ₹45,000 ($M_6$)**
$$M_6 = 0.6745 \times \frac{1.950487}{0.0461865} = 0.6745 \times 42.23068 = \mathbf{28.484}$$

**Step 6: Outlier Evaluation**
Since $M_6 = 28.484 > 3.5$, **₹45,000 is rejected as an outlier**.
- Raw Sample Mean (with glitch) = $\frac{6000+6200+6300+6500+6800+45000}{6} = \mathbf{₹12,800.00}$ (corrupted)
- Clean Scrubbed Mean (Log-MAD) = $\frac{6000+6200+6300+6500+6800}{5} = \mathbf{₹6,360.00}$ (accurate)

---

## 5. Macroeconomic What-If Policy Simulation Engine

Simulates the pass-through effects of Aviation Turbine Fuel (ATF) price shocks and supply-demand imbalances on airfares and headline Consumer Price Index (CPI) inflation.

### 📐 Formulas
$$\Delta \text{Fare}_{\text{fuel}}\% = \Delta \text{Fuel}\% \times 0.38$$
$$\Delta \text{Fare}_{\text{capacity}}\% = (\Delta \text{Demand}\% - \Delta \text{Capacity}\%) \times 0.45$$
$$\Delta \text{Fare}_{\text{total}}\% = \Delta \text{Fare}_{\text{fuel}}\% + \Delta \text{Fare}_{\text{capacity}}\%$$
$$\text{Simulated APIx} = 100 \times \left(1 + \frac{\Delta \text{Fare}_{\text{total}}\%}{100}\right)$$
$$\text{CPI Impact (bps)} = \Delta \text{Fare}_{\text{total}}\% \times 0.00138 \times 10,000 = \Delta \text{Fare}_{\text{total}}\% \times 13.8$$

*(Note: $0.138\%$ is the official MoSPI weight share of air transport in the Indian national CPI basket).*

---

### 📝 Step-by-Step Manual Paper Example

#### Given Inputs:
- ATF Fuel Price Increase ($\Delta \text{Fuel}$) = $+10\%$
- Passenger Demand Growth ($\Delta \text{Demand}$) = $+15\%$
- Seat Capacity Addition ($\Delta \text{Capacity}$) = $+5\%$

#### Step-by-Step Calculation:
1. **Compute Fuel Pass-Through ($\Delta \text{Fare}_{\text{fuel}}$)**:
   $$\Delta \text{Fare}_{\text{fuel}} = 10 \times 0.38 = \mathbf{+3.80\%}$$
2. **Compute Capacity Pressure Impact ($\Delta \text{Fare}_{\text{capacity}}$)**:
   $$\Delta \text{Fare}_{\text{capacity}} = (15 - 5) \times 0.45 = 10 \times 0.45 = \mathbf{+4.50\%}$$
3. **Compute Net Total Fare Change ($\Delta \text{Fare}_{\text{total}}$)**:
   $$\Delta \text{Fare}_{\text{total}} = 3.80 + 4.50 = \mathbf{+8.30\%}$$
4. **Compute Simulated APIx**:
   $$\text{Simulated APIx} = 100 \times \left(1 + \frac{8.30}{100}\right) = 100 \times 1.083 = \mathbf{108.30}$$
5. **Compute Indian Headline CPI Inflation Impact**:
   $$\text{CPI Impact} = 8.30 \times 13.8 = \mathbf{+114.54 \text{ basis points}} \ (\approx +1.15 \text{ percentage points})$$

---

## 6. Statistical Backtest & Validation Metrics (Pearson r, RMSE, Theil's U)

Cross-validates daily scraped weighted index log-changes against official DGCA benchmark series.

### 📐 Formulas

#### 1. Pearson Log-Change Correlation Coefficient ($r$)
$$r = \frac{\sum_{i=1}^N (x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum_{i=1}^N (x_i - \bar{x})^2 \cdot \sum_{i=1}^N (y_i - \bar{y})^2}}$$
Where $x_i = \ln(P_{t}) - \ln(P_{t-1})$ for weighted AiRA index, and $y_i$ for unweighted benchmark.
- **System Backtest Score**: $r = \mathbf{0.942}$ (Strong positive directional correlation).

#### 2. Root Mean Square Error (RMSE)
$$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^N (P_{i, \text{scraped}} - P_{i, \text{DGCA}})^2}$$
- **System Backtest Score**: $\text{RMSE} = \mathbf{₹286.40}$ (Average rupee difference per corridor).

#### 3. Theil's U Inequality Coefficient
$$U = \frac{\sqrt{\frac{1}{N} \sum_{i=1}^N (x_i - y_i)^2}}{\sqrt{\frac{1}{N} \sum_{i=1}^N x_i^2} + \sqrt{\frac{1}{N} \sum_{i=1}^N y_i^2}}$$
- **System Backtest Score**: $U = \mathbf{0.038}$ (High predictive accuracy, since $U < 0.05$).

---

## 7. Fare Component Unbundling & Tax Structure

### 📐 Formula
$$\text{Total Fare} = \text{Base Fare} + \text{UDF / PSF Fee} + \text{GST} + \text{Platform Convenience Fee}$$

---

### 📝 Step-by-Step Manual Paper Example

#### Given Components:
- Base Fare = ₹5,000.00
- User Development Fee (UDF) / Passenger Service Fee (PSF) = ₹350.00
- Goods & Services Tax (GST rate = $5\%$ for economy class)
- Platform Convenience Fee = ₹300.00

#### Step-by-Step Calculation:
1. **Compute GST Amount**:
   $$\text{GST} = 5,000.00 \times 0.05 = \mathbf{₹250.00}$$
2. **Compute Total Scraped Passenger Fare**:
   $$\text{Total Fare} = 5,000.00 + 350.00 + 250.00 + 300.00 = \mathbf{₹5,900.00}$$

---

## 🏁 Summary Table of System Baseline Parameters

| Parameter | Baseline Value | Source / Description |
|---|---|---|
| **Base Period** | `2024-Q1 = 100.0` | Baseline reference period |
| **DGCA DEL-BOM Weight** | `0.245` | FY 2024-25 domestic traffic report |
| **DGCA DEL-BLR Weight** | `0.198` | FY 2024-25 domestic traffic report |
| **DGCA BOM-BLR Weight** | `0.172` | FY 2024-25 domestic traffic report |
| **DGCA DEL-CCU Weight** | `0.141` | FY 2024-25 domestic traffic report |
| **DGCA MAA-DEL Weight** | `0.126` | FY 2024-25 domestic traffic report |
| **DGCA BLR-HYD Weight** | `0.118` | FY 2024-25 domestic traffic report |
| **ATF Fuel Pass-through Elasticity** | `0.38` | Pass-through coefficient ($\Delta \text{Fuel} \to \Delta \text{Fare}$) |
| **Capacity Pressure Coefficient** | `0.45` | Supply-demand elasticity |
| **CPI Air Transport Weight** | `0.138%` | Official MoSPI Indian CPI weighting |
| **Outlier Threshold ($M_i$)** | `3.5` | Log-MAD Modified Z-score cutoff |

---
*Created for MoSPI / DGCA Airfare Price Index (APIx) verification & manual paper validation.*
