# Round 2 Quality Review

## Summary
- Overall quality score: 7.5/10 (vs 5.5/10 in Round 1)
- Critical issues: 3
- Minor issues: 7
- Issues FIXED from Round 1: EB-1B misuse (mostly), Indian backlogs, OPT/CPT for F1, employer sponsor hallucination, E-2 treaty for China/Taiwan/HK, Schedule A nurses, unlawful presence bars, EB-2 NIW for STEM/research
- NEW issues found: IR-2 catastrophic misuse (Test 12), F-4 wrong petitioner rule (Test 2), EB-1A processing time says "no backlog" for China (inaccurate as of 2024+), O-1 under-ranked for chef with extraordinary achievements (Test 16)

## Per-Test Analysis

### Test 1: Chinese H1B, PhD CS, 10 papers, wants GC, sponsor YES
- Quality: Good
- Issues found:
  - EB-1A processing time says "约1-2年（含排期，中国出生申请人无排期）" -- China EB-1 currently has a backlog (approximately 2-3 years as of recent visa bulletins). Claiming "no backlog" is inaccurate.
  - EB-1B rated "medium" which is reasonable since occupation is "researcher" not explicitly at an academic institution. However, the description says "企业从事研究工作" which appropriately broadens it. Acceptable.
  - Overall ranking EB-1A > EB-1B > EB-2 NIW is correct and well-reasoned.

### Test 2: Chinese in China, married to LPR, wants to join spouse
- Quality: Fair
- Issues found:
  - **F-2A is correctly identified as the top match** -- spouse of LPR is F-2A. Good.
  - **F-2B incorrectly offered** -- F-2B is for "unmarried adult children of LPR." The input says the relationship is "spouse," so F-2B is irrelevant to this person. The AI seems to be hedging by offering alternatives for different relationships, but the input clearly states "配偶 (Spouse)."
  - **F-4 incorrectly described**: "美国公民或绿卡持有者的兄弟姐妹" -- F-4 is ONLY for siblings of US CITIZENS, not LPR holders. LPR holders cannot petition siblings. This is a legal error.
  - **IR-5 offered as "low" match** -- IR-5 is for parents of adult US citizens. The input says the person has an LPR family member (spouse), not a USC child. IR-5 is irrelevant here.
  - The notes say "请明确您与美国绿卡持有者家属的具体关系" but the input already specifies "配偶 (Spouse)." The AI is ignoring the provided input.

### Test 3: Chinese F1, Masters Art History non-STEM, wants to work, no sponsor
- Quality: Good
- Issues found:
  - OPT correctly identified as 12 months for non-STEM. Good fix from Round 1.
  - Correctly notes "非STEM专业无法享受24个月STEM延期." Accurate.
  - H-1B listed as "medium" -- appropriate given no sponsor.
  - No CPT mentioned explicitly as a separate option (unlike Test 14), but this person is graduating so CPT is less relevant. Acceptable.
  - Minor: employer sponsor is "否" but H-1B still listed. The description correctly notes "需要找到愿意赞助的雇主" -- not claiming the employer will sponsor. Fixed from Round 1.

### Test 4: Chinese B1/B2 tourist, wealthy, wants EB-5
- Quality: Good
- Issues found:
  - EB-5 correctly ranked "high." Investment amounts and TEA distinction accurate.
  - E-2 correctly marked as "不适用" for Chinese mainland with note about HK/Macau. Good fix from Round 1.
  - Notes correctly warn about B1/B2 status conflicts. Good.
  - Minor: EB-5 traditional project backlog listed as "8-15年" in cons -- this is on the high end but within range for China.

### Test 5: Chinese in China, sibling is USC, family reunification
- Quality: Good
- Issues found:
  - F-4 correctly identified as top match for sibling of US citizen. Processing time 15-22 years for China-born is accurate.
  - IR-5 listed as "low" match with description about becoming USC first to petition parents -- this is speculative and not directly relevant. Minor issue.
  - Overall advice is sound: start F-4 immediately, consider EB-5 if capital available.

### Test 6: Indian F1, PhD Biomedical Eng STEM, publications, wants GC
- Quality: Good
- Issues found:
  - India EB-2 correctly shown as "10年+" backlog. Good fix from Round 1.
  - EB-1A correctly ranked "high" as the best path to avoid India backlog.
  - EB-2 NIW correctly noted as still subject to India backlog despite no employer requirement.
  - OPT correctly noted with STEM 36-month extension for biomedical engineering. Good fix from Round 1.
  - EB-2 NIW rated "high" -- this is slightly misleading since the 10+ year backlog makes it impractical. Should arguably be "medium" given the wait. Minor issue.

### Test 7: Chinese H1B, registered nurse RN, wants GC, sponsor YES
- Quality: Good
- Issues found:
  - Schedule A Group I correctly identified and prioritized. Good fix from Round 1.
  - CGFNS VisaScreen requirement correctly mentioned.
  - EB-2 as alternative correctly noted as less efficient for nurses than Schedule A.
  - Processing times reasonable.
  - Minor: notes say "EB-3约5-8年" for China backlog but the main category says "约2-3年" -- inconsistent. The 5-8 year figure in notes is closer to reality for EB-3 China.

### Test 8: Chinese overstay 2yr, married to USC, US-born child
- Quality: Good
- Issues found:
  - CR-1 correctly identified (not IR-1, since marriage duration unclear but CR-1/IR-1 distinction properly explained).
  - I-601A waiver correctly mentioned for unlawful presence. Good fix from Round 1.
  - 3-year/10-year bars correctly explained: "1-3年逾期 = 3年入境禁令；3年以上逾期 = 10年入境禁令." Note: technically it's 180 days-1 year = 3-year bar, and 1+ year = 10-year bar (not "1-3 years"). The notes section gets this right ("180天至1年非法居留 → 离开美国后3年内禁止入境; 超过1年非法居留 → 10年"), so the main description is slightly off but notes correct it.
  - Important nuance correctly captured: USC spouse can file I-130 + I-485 in the US (adjustment of status), which avoids triggering the bars since the person doesn't leave.
  - US-born child mentioned in scenario but not leveraged in the response -- could mention the child as additional evidence of extreme hardship for I-601A. Minor omission.

### Test 9: Mexican in Mexico, SW eng, Masters CS, wants to work
- Quality: Fair
- Issues found:
  - **TN visa not mentioned** -- Mexico is a NAFTA/USMCA country. Mexican citizens can use TN-1 visa for certain professional occupations. "Computer Systems Analyst" or "Engineer" categories may apply. This is a significant omission for a Mexican software engineer.
  - H-1B correctly ranked "high" but TN should have been mentioned as a faster alternative.
  - Mexico correctly noted as having no backlog. Good.
  - EB-2 processing time "约3-5年（墨西哥出生无排期）" -- if no backlog, the 3-5 years seems high. Should be more like 1.5-3 years (PERM + I-140 + I-485 processing). Minor.

### Test 10: Chinese O1 artist musician, wants GC, no sponsor, extraordinary YES
- Quality: Good
- Issues found:
  - EB-1A correctly ranked "high" for O-1 holder with extraordinary achievements.
  - EB-2 NIW appropriately offered as backup.
  - **EB-1B listed as "medium"** -- for a musician/artist, EB-1B (outstanding professor/researcher) is almost certainly inapplicable unless they teach at a university. The description says "若您在高校或研究机构任教" which is speculative. Should be "low" or omitted. Minor issue -- the AI hedges appropriately but still shouldn't rank it "medium."
  - O-1 maintenance correctly noted as a bridging strategy.

### Test 11: Chinese L1A manager, 15yr exp, MBA, wants GC
- Quality: Good
- Issues found: None significant.
  - EB-1C correctly ranked "high" for L-1A holder. 
  - EB-2 as backup is appropriate.
  - China backlog correctly reflected across categories.
  - No EB-1B mentioned (correct -- this is a corporate manager, not professor/researcher).

### Test 12: Chinese in China, HS diploma, age 55, daughter USC age 30
- Quality: **Poor** -- CRITICAL ERROR
- Issues found:
  - **IR-2 catastrophically misused**: IR-2 is ranked "high" and described as the top recommendation. IR-2 is ONLY for unmarried minor children (under 21) of US citizens. This person is a 55-year-old PARENT of a 30-year-old USC daughter. The correct category is **IR-5** (parent of adult US citizen, age 21+). IR-5 is listed but only as "low" match. This is backwards.
  - The IR-2 description even says "子女必须未满21岁且未婚" in requirements, but then ranks it "high" for a 55-year-old parent. The AI contradicts itself.
  - **F-2A incorrectly offered** -- F-2A is for spouses/minor children of LPR holders. The input says the family member is a USC daughter, not an LPR. F-2A is irrelevant.
  - CR-1/IR-1 listed as "low" -- this is for USC spouses. No spouse relationship indicated. Irrelevant.
  - **The correct and only answer here is IR-5**, which should be ranked "high." The daughter (USC, age 30) petitions for the parent. No backlog, 1-2 year processing. This is a straightforward case that the AI completely botched.

### Test 13: Taiwanese H1B, wants E-2 investor visa to start business
- Quality: Good
- Issues found:
  - E-2 correctly available for Taiwan. Good fix from Round 1.
  - E-2 ranked "high" -- appropriate.
  - EB-5, L-1A, EB-1C all appropriately offered as alternatives.
  - Minor: EB-5 pro says "农村/SET-ASIDE项目投资额更低（$1.05M）" -- $1.05M is actually the STANDARD (non-TEA) amount, not the reduced amount. The reduced TEA amount is $800K. This is an error in the EB-5 section.

### Test 14: Chinese F1, Bachelors CS STEM, graduating, wants OPT then H1B
- Quality: Good
- Issues found:
  - OPT correctly shows 12 months + 24 month STEM extension = 36 months total. Good.
  - CPT correctly mentioned as a separate option. Good fix from Round 1.
  - H-1B appropriately ranked "high" as the next step after OPT.
  - EB-3 listed with realistic China backlog (5-8 years). 
  - No mention of EB-2 possibility even though Bachelor + 5 years experience could eventually qualify. But since the person has 0 years experience currently, this is appropriate.

### Test 15: Chinese GC holder 6yr, wants citizenship, married to USC
- Quality: Good
- Issues found:
  - Correctly identifies the 3-year rule for spouses of USC (vs standard 5-year rule). Person has 6 years so qualifies either way.
  - Naturalization requirements accurately listed.
  - Minor: civics test description says "100题中答对至少6题" -- the actual requirement is answer 6 out of 10 questions correctly (USCIS asks 10 from the 100-question pool). This phrasing is misleading.
  - Note about losing Chinese citizenship is accurate and important.

### Test 16: Chinese chef, Michelin star, wants O1, extraordinary YES
- Quality: Fair
- Issues found:
  - **O-1 ranked "low" despite hasExtraordinaryAchievements=true and scenario mentioning "Michelin star"** -- A Michelin-starred chef is a classic O-1 candidate. O-1 should be ranked "high" or at minimum "medium-high." The scenario title says "Michelin star" and the input has extraordinary achievements = true, yet O-1 is buried at "low." This is a significant ranking error.
  - EB-3 ranked "high" is puzzling for someone with extraordinary achievements. EB-3 is the slowest path (7-10 years). For a Michelin-starred chef, O-1 (immediate work authorization) or EB-1A (no backlog) should be prioritized.
  - **EB-1A not mentioned at all** -- a Michelin-starred chef with 10+ years experience and extraordinary achievements could qualify for EB-1A. This is a significant omission.
  - The notes partially acknowledge this ("如果这包括国际烹饪大赛获奖、米其林星级餐厅经验...O-1可能更快") but the ranking doesn't reflect it.

### Test 17: Korean H1B dentist, wants GC, sponsor YES
- Quality: Good
- Issues found:
  - Korea correctly noted as having no backlog. Good.
  - EB-3 ranked "high" is reasonable for a dentist with Bachelor's.
  - EB-2 discussion about DDS/DMD equivalence is thoughtful and appropriate.
  - Minor: processing time "约4-6年（韩国国籍，无排期等待）" -- if there's no backlog, 4-6 years is too long. Should be ~2-3 years (PERM 6-12 months + I-140 6-12 months + I-485 6-12 months).

### Test 18: Chinese asylum seeker, political persecution, expired tourist visa
- Quality: Good
- Issues found:
  - Asylum correctly identified as primary path.
  - 1-year filing deadline correctly emphasized.
  - Unlawful presence bars (180 days-1 year = 3-year bar; 1+ year = 10-year bar) correctly explained. Good fix from Round 1.
  - Important note that asylum applicants can file regardless of immigration status -- correct.
  - TPS correctly noted as N/A for China.
  - Minor: does not mention withholding of removal or CAT (Convention Against Torture) as alternatives if the 1-year deadline has passed. These are important fallback options.

### Test 19: Chinese H1B SW eng, Bachelors only, 12yr exp, wants EB-2
- Quality: Good
- Issues found:
  - EB-3 correctly ranked "high" for Bachelor's degree holder.
  - EB-2 via "equivalent degree through work experience" correctly identified as a possibility with 10+ years experience. Under USCIS policy, Bachelor's + 5 years progressive experience can qualify as equivalent to Master's for EB-2. Appropriately noted as requiring lawyer evaluation.
  - EB-2 NIW mentioned as an option -- appropriate.
  - China backlog correctly shown: EB-3 5-8 years, EB-2 3-5 years.
  - EB-1A listed as "low" -- appropriate for someone without extraordinary achievements.

### Test 20: Hong Kong SAR passport, wants to start business, E-2
- Quality: Good
- Issues found:
  - E-2 correctly available for HK SAR passport holders. Good fix from Round 1.
  - E-2 ranked "high" -- appropriate.
  - EB-5 and L-1A/EB-1C alternatives appropriately offered.
  - Minor: EB-1C description says "中国出生无排期问题" -- HK-born applicants are charged to "China - mainland born" for visa quota purposes UNLESS they use a different chargeability. This nuance could matter but is a minor point.

## Remaining Systemic Issues

### 1. CRITICAL: IR-2 misuse (Test 12)
The AI used IR-2 (minor children of USC) for a parent of a USC. This is a fundamental category error that survived from Round 1 or is a new regression. The family category logic needs explicit guardrails: IR-2 = unmarried child UNDER 21 of USC; IR-5 = parent of USC aged 21+.

### 2. CRITICAL: O-1 and EB-1A under-ranked for extraordinary achievers (Test 16)
When `hasExtraordinaryAchievements=true` and the scenario describes a Michelin-starred chef, the system ranked O-1 as "low" and omitted EB-1A entirely. The `hasExtraordinaryAchievements` flag should directly boost O-1 and EB-1A rankings.

### 3. MODERATE: TN visa missing for Mexican nationals (Test 9)
TN-1 visa under USMCA is a major pathway for Mexican professionals (engineers, computer systems analysts, etc.) and was completely omitted.

### 4. MODERATE: China EB-1 backlog understated
Multiple tests claim China EB-1A/EB-1B has "no backlog" or "无排期." As of recent visa bulletins, China EB-1 has a backlog of approximately 2-3 years. This should be reflected in processing times.

### 5. MINOR: Irrelevant categories offered
Several tests include categories that are clearly inapplicable given the input (e.g., F-2B for a spouse in Test 2, F-2A for someone with a USC child in Test 12). The system should filter out categories that contradict the stated relationship.

### 6. MINOR: Processing time inconsistencies for no-backlog countries
For countries with no backlog (Korea, Mexico, Philippines, Taiwan, HK), processing times are sometimes stated as 4-6+ years when they should be 1.5-3 years (PERM + I-140 + I-485 without queue delays).

## Recommended Prompt Fixes

### Fix 1: Family category guard rails (CRITICAL)
Add explicit logic:
```
- IR-2: ONLY for unmarried children UNDER 21 of US citizen. NEVER use for parents.
- IR-5: For parents of US citizen aged 21+. If familyRelationship = "子女" AND the petitioner (USC child) is 21+, the applicant is the PARENT → use IR-5.
- F-2A: ONLY for spouses or unmarried minor children of LPR. Do NOT use if family member is USC.
- F-4: ONLY for siblings of US CITIZENS (not LPR holders).
```

### Fix 2: Extraordinary achievement boost (CRITICAL)
Add rule:
```
When hasExtraordinaryAchievements=true:
- O-1 must be ranked "high" (if goal is work)
- EB-1A must be ranked "high" (if goal is green card)
- These should appear as top recommendations, regardless of education level or occupation
```

### Fix 3: TN visa for USMCA nationals
Add rule:
```
If citizenship is Mexico or Canada and goal is to work in the US:
- Include TN visa as a "high" match option
- Note that TN covers 60+ professional categories including engineers, computer systems analysts, accountants, etc.
- TN is faster than H-1B (no lottery, no cap) but does not have dual intent
```

### Fix 4: China EB-1 backlog correction
Update processing times:
```
China-born EB-1A/EB-1B/EB-1C: currently has a backlog of approximately 2-3 years (not "no backlog")
Check USCIS visa bulletin for current priority dates
```

### Fix 5: Filter irrelevant family categories
Add validation:
```
Do not include family categories that contradict the stated familyRelationship.
If relationship is "配偶" → only show spouse-relevant categories (CR-1/IR-1 for USC spouse, F-2A for LPR spouse)
If relationship is "子女" and applicant is the parent → show IR-5 (if child is USC 21+) or F-1 (if child is USC 21+ and applicant is unmarried)
```

### Fix 6: Withholding of Removal / CAT for asylum cases
Add to asylum scenarios:
```
If the 1-year asylum filing deadline may have passed, mention:
- Withholding of Removal (no 1-year deadline, but higher burden of proof)
- Convention Against Torture (CAT) protection (no deadline, must show likelihood of torture)
```
