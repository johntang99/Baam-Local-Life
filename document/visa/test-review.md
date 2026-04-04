# Visa Screener Quality Review

## Summary
- Tests reviewed: 20
- Overall quality score: 5.5/10
- Critical issues found: 14
- Minor issues found: 18

The screener demonstrates solid general knowledge but has several recurring critical errors that could mislead users on important immigration matters. The most concerning patterns are: incorrect family immigration category codes, failure to flag Indian EB-2/EB-3 extreme backlogs, incorrect statements about E-2 for Chinese applicants (rated too high), missing OPT/CPT guidance for F-1 students, and inconsistent treatment of overstay consequences.

---

## Per-Test Analysis

### Test 1: Chinese H1B SW eng, Masters CS, wants green card, sponsor YES
- Categories: EB-2 (high), EB-1B (low), EB-3 (low)
- Quality: Good
- Issues:
  - EB-2 NIW (National Interest Waiver) is not mentioned as a separate option. For a software engineer with 5-10 years experience, NIW could be a viable self-petition path that doesn't require employer sponsorship, which is worth flagging even if match is medium/low.
  - EB-1B description says "杰出研究人员/教授" but EB-1B requires the petitioner to be a university or research institution. A typical software company cannot sponsor EB-1B. The response doesn't clarify this critical requirement. EB-1A would be more appropriate to mention for a software engineer at a tech company.
  - Processing time "约5-7年" for EB-2 is reasonable for China-born. Good.
  - Notes mention "硕士学位免除劳工测试中的某些要求" -- this is misleading. A Master's degree does not exempt anyone from PERM. It qualifies them for EB-2 instead of EB-3, but PERM is still required unless going NIW.
- Missing: EB-2 NIW as a separate recommendation; EB-1A (more relevant than EB-1B for industry SW engineers)
- Wrong: EB-1B is inappropriate for most software engineers at tech companies (requires academic/research institution employer)

### Test 2: Chinese F1 student, Bachelors business, wants to work, no sponsor
- Categories: H-1B (high), EB-3 (medium), EB-2 (low)
- Quality: Fair
- Issues:
  - **CRITICAL**: The note says "作为F-1学生，您有资格直接申请H-1B，无需先办理OPT" -- This is misleading. While technically an F-1 student can be petitioned for H-1B, the practical reality is they need OPT to work legally between graduation and H-1B start date (October 1). The response completely fails to explain CPT and OPT, which are the most immediate and relevant work authorization options for an F-1 student.
  - **CRITICAL**: The user said "no sponsor" but the response recommends H-1B (which requires employer sponsorship) as "high" match. The response should have emphasized that finding a sponsor is a prerequisite, not assumed it.
  - Business management is NOT a STEM field, so OPT would only be 12 months (not 36). This distinction is critical and not mentioned at all.
  - H-1B lottery probability is mentioned as 20-30%, which is roughly accurate.
  - EB-3 and EB-2 are long-term options, reasonable to mention but premature for someone with 0-1 years experience.
- Missing: OPT (12-month post-graduation work authorization -- the most immediate option), CPT (if still in school), STEM OPT extension distinction
- Wrong: H-1B rated "high" when user has no sponsor; misleading statement about not needing OPT

### Test 3: Chinese B1B2 tourist, no degree, restaurant worker, wants green card
- Categories: EB-3 (medium)
- Quality: Fair
- Issues:
  - Good: The response correctly flags that B1/B2 holders cannot work and this is a critical issue. The warning is prominent.
  - The response says "雇主已表示愿意担保" in the pros, but the input shows `hasEmployerSponsor: "否"`. The system is hallucinating employer sponsorship that doesn't exist. This is a factual error.
  - **CRITICAL**: The response doesn't adequately explain the 3-year / 10-year bar for unlawful presence. If the person has been working illegally on B1/B2, they likely have unlawful presence issues. If they leave the US after 180+ days of unlawful presence, they face a 3-year bar; after 1 year, a 10-year bar. This is crucial information that's missing.
  - EB-5 is not mentioned even though it requires no education or employer -- though the investment amount may be prohibitive.
- Missing: 3-year/10-year unlawful presence bar explanation; 245(i) discussion if applicable
- Wrong: Claims employer is willing to sponsor when input says no sponsor

### Test 4: Chinese in China, PhD physics, wants to work, extraordinary=true
- Categories: EB-1A (high), EB-2 (high), EB-1B (medium), H-1B (medium)
- Quality: Good
- Issues:
  - EB-2 says "雇主已确认" but `hasEmployerSponsor` is "否". Another hallucination of employer sponsorship.
  - H-1B says "雇主支持（已确认）" -- same error.
  - For a physicist in China with no US employer, H-1B and EB-2 requiring employer are somewhat premature recommendations unless they find a US employer first. The response should emphasize finding a position first.
  - EB-1A and EB-2 NIW are the most relevant since they don't require employer sponsorship. Good that EB-1A is listed first.
  - Good note about export control/national security review for Chinese physicists.
  - J-1 research scholar visa is not mentioned as a possible entry path to the US.
- Missing: EB-2 NIW (self-petition, no employer needed -- perfect for this scenario); J-1 research scholar visa
- Wrong: Claims employer confirmed sponsorship when input says no sponsor

### Test 5: Chinese H1B nurse, Bachelors nursing, wants green card, sponsor YES
- Categories: EB-3 (high), EB-2 (medium), EB-1B (low)
- Quality: Fair
- Issues:
  - EB-3 as primary recommendation is correct for a nurse with BSN.
  - EB-1B description is wrong -- it says "非凡能力从业者" and "employerRequired: false" but EB-1B (Outstanding Professor/Researcher) requires an employer. The description seems to confuse EB-1B with EB-1A. EB-1A is the self-petition category.
  - EB-2 mention is reasonable but correctly notes Bachelor's doesn't qualify directly.
  - Schedule A Group I is completely missing. Nurses (RNs) qualify for Schedule A, which pre-certifies them for PERM, significantly shortening the process. This is a major omission for any nurse immigration case.
- Missing: **Schedule A Group I** -- nurses are pre-certified for PERM under Schedule A, which dramatically simplifies the process. This is a critical omission.
- Wrong: EB-1B description and requirements are confused with EB-1A; EB-1B listed as not requiring employer when it does

### Test 6: Chinese citizen, married to US citizen, wants green card
- Categories: IR-2 (high), EB-3 (low)
- Quality: Fair
- Issues:
  - **CRITICAL**: The category code is wrong. IR-2 is for minor children of US citizens. The correct code for spouse of US citizen is **IR-1** (if married 2+ years) or **CR-1** (if married less than 2 years). This is a fundamental category code error.
  - The response says "配偶无需有工作或收入要求" in pros -- this is wrong. The US citizen petitioner MUST demonstrate they meet the income requirement (125% of poverty guidelines) via Form I-864 Affidavit of Support, or use a joint sponsor.
  - EB-3 is irrelevant here -- person is a homemaker with no employer. The input says no employer sponsor. Listing EB-3 makes no sense.
  - Good: Warning about B1/B2 work restrictions.
  - The response mentions "如配偶为永久居民而非公民" which is good hedging, but the input clearly states USC family member.
  - Missing: Discussion of conditional vs. permanent green card (2-year marriage threshold).
- Missing: Correct category code (IR-1/CR-1); conditional green card explanation; I-864 income requirement
- Wrong: IR-2 code (should be IR-1/CR-1); claim that petitioner has no income requirement; EB-3 recommendation with no employer

### Test 7: Chinese in China, parent is US citizen, wants family reunification
- Categories: IR-2 (high), F-2A (high), EB-3 (medium)
- Quality: Poor
- Issues:
  - **CRITICAL**: IR-2 is for minor children (under 21) of US citizens. For adult children (over 21) of US citizens, the correct category is **F-1** (unmarried adult children of USC) or **F-3** (married adult children of USC). The person is a teacher with 5-10 years experience, clearly an adult.
  - If unmarried adult child of USC: F-1 category, with significant wait times for China-born (currently ~7+ years).
  - If married adult child of USC: F-3 category, wait times even longer (~13+ years for China-born).
  - **CRITICAL**: F-2A is completely wrong. F-2A is for spouses and minor children of Legal Permanent Residents (LPR). The person's parent is a USC, not an LPR. And even if parent were LPR, F-2A doesn't apply to adult children over 21.
  - The response says IR-2 "无排期" -- only true for immediate relatives (parents, spouses, minor children of USC). Adult children are NOT immediate relatives.
  - EB-3 mention is reasonable as an alternative path.
  - Processing time of "8-12个月" is wildly wrong for an adult child of USC. F-1 category for China-born is 7+ years.
- Missing: Correct family preference categories (F-1 or F-3); accurate wait times (7-15+ years for China-born)
- Wrong: IR-2 (wrong category); F-2A (wrong category and wrong relationship); "no backlog" claim for what is actually a heavily backlogged category

### Test 8: Chinese L1 manager, Masters MBA, wants green card, sponsor YES
- Categories: EB-1C (high), EB-2 (high), EB-1B (low)
- Quality: Good
- Issues:
  - EB-1C recommendation is excellent and appropriate for L-1A managers. Good notes about confirming L-1A vs L-1B.
  - EB-2 as backup is reasonable.
  - EB-2 pro says "硕士学位自动豁免PERM要求（可走NIW路线）" -- this is misleading. Having a Master's does NOT automatically exempt from PERM. NIW is a separate petition that must be approved; it's not automatic.
  - EB-1B is irrelevant for a corporate manager with MBA. EB-1B is for outstanding professors/researchers at academic institutions. This is a pattern of EB-1B being recommended inappropriately.
  - Processing times are reasonable.
- Missing: Nothing major
- Wrong: EB-1B recommendation (not applicable to corporate managers); misleading statement about Master's auto-exempting PERM

### Test 9: Chinese in China, HS only, brother is US citizen, wants family
- Categories: IR/CR (high), F2A (medium), EB-3 (low)
- Quality: Poor
- Issues:
  - **CRITICAL**: The correct category for siblings of US citizens is **F-4**, not IR/CR or F-2A. This is a fundamental error.
  - IR/CR is for immediate relatives (spouses, parents, minor children). Siblings are NOT immediate relatives.
  - F-2A is for spouses and minor children of LPRs. Completely wrong for a sibling relationship.
  - F-4 (siblings of US citizens) has the longest wait time of all family categories -- approximately **20+ years** for China-born applicants. The response says "3-5年" which is catastrophically wrong.
  - The response suggests checking for "other immediate relatives" which is reasonable advice, but the core category recommendations are all wrong.
  - EB-3 as backup is reasonable but says "雇主已表示愿意担保" when input says no employer sponsor. Another hallucination.
- Missing: F-4 category (the only correct one for siblings of USC); accurate ~20+ year wait time for China-born F-4
- Wrong: IR/CR (wrong relationship), F-2A (wrong relationship), fabricated employer sponsorship, wildly inaccurate processing times

### Test 10: Chinese O1 visa, arts, wants green card, extraordinary=true
- Categories: EB-1A (high), EB-1B (medium), EB-2 NIW (medium), EB-1A w/employer (medium)
- Quality: Good
- Issues:
  - EB-1A as primary recommendation is excellent. O-1 holders are strong EB-1A candidates.
  - Listing "EB-1A through employer" as a separate category is redundant and confusing. EB-1A is EB-1A regardless of whether an employer supports it.
  - EB-1B for an artist is questionable. EB-1B is for outstanding professors/researchers. Unless the artist teaches at a university, EB-1B doesn't apply.
  - EB-2 NIW mention is good as a backup.
  - Processing times are reasonable.
  - No employer sponsor indicated but EB-1A self-petition is correctly identified as not requiring one.
- Missing: Nothing major
- Wrong: EB-1B likely inapplicable for performing artist (unless teaching at university); redundant EB-1A listing

### Test 11: Chinese F1, Masters EE, wants to start business, self-employed
- Categories: E-2 (low), EB-5 (medium), H-1B (medium), L-1A (low)
- Quality: Fair
- Issues:
  - Good: E-2 correctly flagged as unavailable for Chinese mainland nationals. However, rating it "low" instead of explicitly "not applicable" could mislead users. The description mentions "third country nationality" as workaround, which is technically possible but impractical for most.
  - EB-5 investment thresholds are correct ($800K TEA / $1.05M standard). Good.
  - **CRITICAL**: F-1 students cannot simply start businesses. OPT is mentioned nowhere. A STEM OPT extension (36 months total for EE) could allow the student to work for a startup under specific conditions, but self-employment on OPT has strict requirements (must be employed by the company, company must use E-Verify). This nuance is completely missing.
  - H-1B mention is reasonable but the person said "self-employed" -- H-1B requires a traditional employer-employee relationship. Self-petitioned H-1B is possible but much harder.
  - L-1A for someone with 0-1 years experience makes no sense. Correctly flagged in cons but shouldn't be listed.
  - Good warning about F-1 business restrictions.
  - O-1 visa is not mentioned -- for an EE master's student wanting to stay in the US, if they have extraordinary ability, O-1 allows self-employment more flexibly.
- Missing: OPT/STEM OPT discussion; O-1 as potential path; Day-1 CPT discussion
- Wrong: L-1A for someone with 0-1 years experience; E-2 should be "not applicable" not "low"

### Test 12: Chinese in China, wants to study in US, Bachelors, no experience
- Categories: F-1 (high), H-1B (medium), EB-2 (low)
- Quality: Good
- Issues:
  - F-1 as primary recommendation is correct and appropriate.
  - Good mention of OPT (12-36 months) though should specify STEM vs non-STEM OPT difference more clearly.
  - H-1B and EB-2 as long-term planning items are reasonable.
  - The person already has a Bachelor's -- the response seems to assume they're applying for undergraduate study when they might want a Master's program. Should clarify.
  - J-1 exchange visitor visa is not mentioned as an alternative.
  - M-1 vocational visa not mentioned (though less relevant here).
- Missing: STEM vs non-STEM OPT distinction; J-1 alternative; clarification on whether seeking undergrad or grad study
- Wrong: Nothing major

### Test 13: Indian H1B SW eng, Masters CS, wants green card (non-Chinese)
- Categories: EB-2 (high), EB-1B (low), EB-3 (medium)
- Quality: Poor
- Issues:
  - **CRITICAL**: The response says "印度出生在EB-2排期相对合理" and "约2-3年" processing time. This is **catastrophically wrong**. Indian EB-2 backlog is currently **10+ years** (some estimates 50+ years for new filers). India has the worst EB-2 backlog of any country, far worse than China. The response seems to have inverted India and China's situations.
  - The note says "相比中国大陆申请人情况要好得多" -- this is factually wrong. India's EB-2/EB-3 backlogs are significantly WORSE than China's.
  - EB-3 processing time "约4-6年" is also wildly wrong for India-born. Indian EB-3 is also 10+ years.
  - EB-1B is again confused -- says "employerRequired: false" and describes it as self-petition, which is EB-1A behavior. EB-1B requires employer sponsorship.
  - Should mention EB-1A as a viable option if the engineer has significant achievements.
  - Should strongly emphasize that Indian nationals face the worst green card backlogs globally and recommend EB-1A as the best way to avoid them.
- Missing: Accurate India EB-2/EB-3 wait times (10+ years); EB-1A recommendation; EB-2 NIW option
- Wrong: Processing times are dramatically underestimated; claim that India is better than China (opposite is true for EB-2/EB-3); EB-1B confused with EB-1A

### Test 14: Chinese overstay, restaurant cook, no degree
- Categories: EB-3 (high), 特赦/身份调整 (high)
- Quality: Fair
- Issues:
  - Good: Prominent warning about overstay and not leaving the US.
  - **CRITICAL**: The response says employer is willing to sponsor ("雇主愿意担保是主要优势") but input shows `hasEmployerSponsor: "否"`. Another hallucination.
  - **CRITICAL**: The response doesn't adequately explain INA 245(i) -- for someone who overstayed, they generally cannot adjust status in the US unless they are an immediate relative of a USC or covered by old 245(i) provisions. The response makes it sound like they can simply file I-485 with employer sponsorship, which is not accurate for most overstay cases.
  - The 3-year/10-year unlawful presence bar is mentioned obliquely ("面临遣返和再入境禁止") but not explained clearly. If they leave the US, they could be barred from re-entry.
  - "特赦/身份调整" is not a real visa category. While creative, using invented categories could confuse users.
  - The response should more strongly emphasize that without a USC spouse/parent, the options are extremely limited for an overstay with no degree and no employer.
  - Cost estimate of $3,000-$8,000 for attorney fees is reasonable.
- Missing: Clear explanation of 245(i) requirements; 3/10-year bar details; I-601/I-212 waiver discussion; realistic assessment that options are very limited without USC family
- Wrong: Fabricated employer sponsorship; oversimplified adjustment of status process for overstay

### Test 15: Chinese with green card, wants naturalization
- Categories: Naturalization (high)
- Quality: Good
- Issues:
  - Naturalization requirements are mostly correct.
  - Physical presence requirement is stated as "2.5年" which is correct (30 months out of 5 years).
  - Good note about China not recognizing dual citizenship.
  - Application fee listed as "$640" -- the current N-400 fee is $710 (increased in 2024). Minor but should be accurate.
  - The 50/20 exception for elderly applicants (50+ years old with 20+ years as LPR, or 55+ with 15+ years) allowing the civics test in native language is not mentioned.
  - Continuous residence requirement not mentioned (cannot be absent for 6+ consecutive months without breaking continuous residence).
  - The response correctly notes 5 years for regular GC holders, 3 years if married to USC.
- Missing: 50/20 and 55/15 elderly exemptions for English requirement; continuous residence rules; accurate filing fee
- Wrong: Filing fee slightly outdated

### Test 16: Chinese B1B2, real estate investor, wants EB-5
- Categories: E-2 (medium), EB-5 (medium), L-1A (low), H-1B (low)
- Quality: Fair
- Issues:
  - **CRITICAL**: E-2 is rated "medium" match but Chinese mainland nationals are NOT eligible for E-2. It should be rated "not applicable" or at minimum "low" with very clear caveat. The description mentions the treaty issue but the "medium" rating is misleading.
  - EB-5 thresholds are correct ($800K TEA / $1.05M). Good.
  - EB-5 ranked only "medium" when it's actually the best fit for a wealthy real estate investor wanting to stay in the US. Should be "high".
  - Good B1/B2 work restriction warning.
  - L-1A mention is reasonable if person has Chinese company.
  - H-1B is irrelevant for someone whose goal is investing/entrepreneurship.
  - EB-5 排期 listed as 8-12 years for China which is on the high end but within range for traditional EB-5. The new EB-5 reform (2022 RIA) created set-aside visas for rural TEA and infrastructure projects that have NO backlog. This is a major omission.
- Missing: EB-5 Reform and Integrity Act (2022) set-aside categories with no backlog; EB-5 should be rated higher
- Wrong: E-2 rated "medium" for Chinese national (should be N/A or explicitly ineligible)

### Test 17: Chinese H1B, accountant, Bachelors, 10+ years, wants green card
- Categories: EB-3 (high), EB-2 (medium), EB-1B (low)
- Quality: Fair
- Issues:
  - EB-3 as primary is defensible since person only has Bachelor's.
  - **Important**: EB-2 via Bachelor's + 5 years progressive experience is a well-established path (not "uncertain" as the response suggests). With 10+ years experience, this person very likely qualifies for EB-2 under the "Bachelor's + 5 years" route. The response understates this -- it should be rated "high" alongside EB-3.
  - EB-1B is wrong again. An accountant at a company is not a professor or researcher. Should be EB-1A if anything, and even that is a stretch for most accountants.
  - EB-1B says "employerRequired: false" which is wrong. EB-1B always requires employer sponsorship.
  - CPA mention is good and relevant.
  - Processing times are reasonable.
- Missing: Stronger EB-2 recommendation (Bachelor's + 5 years is well-established); EB-2 NIW consideration
- Wrong: EB-1B recommendation (wrong category for accountant); EB-1B employer requirement error

### Test 18: Chinese in China, chef 15yrs, no degree, US employer sponsor
- Categories: EB-3 (high), H-2B (medium), L-1B (low)
- Quality: Good
- Issues:
  - EB-3 as primary is correct for a skilled worker with extensive experience.
  - H-2B mention is reasonable for temporary work but correctly notes it doesn't lead to green card.
  - **Issue**: H-2B is for temporary/seasonal work. A year-round restaurant position would NOT qualify for H-2B. The response doesn't flag this critical limitation.
  - L-1B is unlikely but not unreasonable if there's a cross-national company relationship.
  - Processing times for EB-3 (8-12 years China-born) are realistic.
  - Goal is "work in US" not green card, so H-2B and work visa options should be emphasized more.
  - H-1B is not mentioned but wouldn't apply (no degree).
  - P-1 or O-1 could apply if chef has extraordinary culinary achievements (not indicated here).
- Missing: H-2B seasonal/temporary requirement explanation; possible specialty chef arguments
- Wrong: H-2B may not apply to year-round restaurant position (this limitation not flagged)

### Test 19: Filipino nurse, Bachelors, employer sponsor, wants green card
- Categories: EB-3 (high), EB-2 (medium)
- Quality: Fair
- Issues:
  - EB-3 as primary is correct.
  - **CRITICAL**: Filipino nurses have a specific advantage -- Philippines is generally current (no backlog) for EB-3. The response says "约3-5年" but it should be significantly shorter, potentially 1-2 years total. The response understates the advantage.
  - EB-2 mention is reasonable.
  - **Missing**: Schedule A Group I is again not mentioned. Nurses qualify for pre-certification under Schedule A, which eliminates the need for traditional PERM recruitment. This is a critical omission for any nurse immigration case.
  - The response is in Chinese but the applicant is Filipino. While the product serves Chinese communities, a Filipino user might need English guidance. Minor UX consideration.
  - Processing times understate the Filipino advantage.
- Missing: Schedule A Group I pre-certification; accurate (shorter) processing times for Philippines-born; VisaScreen certificate requirement
- Wrong: Processing time overstated for Filipino EB-3

### Test 20: Chinese F1 PhD, biomedical research, publications, wants to stay
- Categories: EB-1B (high), EB-2 (high), EB-1A (medium), H-1B (medium)
- Quality: Good
- Issues:
  - EB-1B as primary for a PhD researcher is appropriate.
  - EB-1A should arguably be ranked higher than "medium" given the person has extraordinary achievements indicated. For someone with publications and a PhD in biomedical research, EB-1A is often the best path.
  - EB-2 NIW is not explicitly mentioned as a separate category. For a biomedical researcher, NIW is a very strong option (Dhanasar framework favors STEM researchers).
  - H-1B mention is reasonable as transition path, correctly notes lottery requirement.
  - **Issue**: The person has no employer sponsor, but EB-1B requires employer sponsorship. The response lists EB-1B as high match despite no sponsor. EB-1A (self-petition) should be higher.
  - Good mention of OPT not being discussed -- but should explicitly discuss OPT/STEM OPT as the immediate next step after graduation.
  - Processing times are reasonable.
- Missing: EB-2 NIW as explicit separate option (strong for biomedical researchers); OPT/STEM OPT as immediate step; stronger EB-1A ranking
- Wrong: EB-1B ranked highest despite no employer sponsor; EB-1A underranked

---

## Common Patterns / Systemic Issues

### 1. Family Immigration Category Codes Are Consistently Wrong (CRITICAL)
Tests 6, 7, and 9 all have incorrect family immigration category codes:
- IR-2 used for spouse (should be IR-1/CR-1)
- IR-2 used for adult child (should be F-1 or F-3)
- F-2A used for adult child of USC (wrong -- F-2A is for spouse/minor child of LPR)
- IR/CR used for sibling (should be F-4)
- F-2A used for sibling (completely wrong)

The system appears to have an incorrect mapping of family relationship categories. This must be fixed as it gives users fundamentally wrong information.

### 2. EB-1B Is Systematically Misused (CRITICAL)
EB-1B (Outstanding Professor/Researcher) is recommended in 8 out of 20 tests, often inappropriately:
- Recommended for software engineers at tech companies (Test 1)
- Recommended for corporate managers (Test 8)
- Recommended for accountants (Test 17)
- Recommended for performing artists (Test 10)
- Sometimes listed as not requiring employer (Tests 5, 13, 17) when it always does
- Sometimes confused with EB-1A criteria

EB-1B is narrowly for professors/researchers at academic or research institutions. It should only be recommended when the employer is a university or research organization.

### 3. Employer Sponsorship Hallucination (CRITICAL)
In at least 4 tests (3, 4, 9, 14), the response states or implies the employer has confirmed willingness to sponsor when the input explicitly says `hasEmployerSponsor: "否"`. This is a data integrity issue in the prompt or response generation.

### 4. Indian EB Backlog Completely Wrong (CRITICAL)
Test 13 dramatically underestimates Indian EB-2/EB-3 backlogs, claiming India is better than China. In reality, India has the worst employment-based backlogs globally (10-50+ years for EB-2/EB-3). This is perhaps the single most dangerous error in the entire test suite.

### 5. OPT/CPT Consistently Missing for F-1 Students
Tests 2, 11, and 20 involve F-1 students but none adequately explain OPT or CPT, which are the most immediate work authorization options. STEM OPT extensions (24 additional months) are barely mentioned.

### 6. E-2 Treaty Investor Rated Too High for Chinese Nationals
Tests 11 and 16 rate E-2 as "low" or "medium" for Chinese mainland nationals. Since China has no E-2 treaty with the US, E-2 should be explicitly marked as "not applicable" or "ineligible" with only a brief note about third-country nationality workarounds.

### 7. EB-2 NIW Consistently Underrepresented
The National Interest Waiver (EB-2 NIW) is one of the most important self-petition options for skilled professionals, especially in STEM fields. It's barely mentioned across all tests despite being highly relevant for Tests 1, 4, 10, 11, 17, and 20.

### 8. Schedule A for Nurses Never Mentioned
Tests 5 and 19 both involve nurses but neither mentions Schedule A Group I, which pre-certifies nurses for PERM and significantly shortens the green card process. This is a critical omission for nurse immigration cases.

### 9. Unlawful Presence Consequences Inadequately Explained
Tests 3 and 14 involve people with potential unlawful presence but the 3-year and 10-year bars (INA 212(a)(9)(B)) are not clearly explained.

---

## Recommended Prompt Improvements

### 1. Fix Family Immigration Category Mapping
Add this explicit mapping to the system prompt:

```
Family Immigration Categories (MUST use correct codes):
- IR-1: Spouse of US Citizen (married 2+ years)
- CR-1: Spouse of US Citizen (married < 2 years, conditional)
- IR-2: Unmarried child UNDER 21 of US Citizen
- IR-5: Parent of US Citizen (petitioner must be 21+)
- F-1: Unmarried adult child (21+) of US Citizen — backlog ~7-22 years for China
- F-2A: Spouse or minor child of LPR — backlog ~2-3 years
- F-2B: Unmarried adult child (21+) of LPR — backlog ~6-9 years
- F-3: Married adult child of US Citizen — backlog ~13-15 years for China
- F-4: Sibling of US Citizen — backlog ~15-22 years for China

NEVER confuse these categories. IR-2 is ONLY for minor children. Siblings are ALWAYS F-4.
```

### 2. Fix EB-1B Usage Rules
Add to system prompt:

```
EB-1B Rules:
- EB-1B is ONLY for Outstanding Professors or Researchers
- ALWAYS requires employer sponsorship (employer must be a university, research institution, or private employer with research function)
- Cannot be self-petitioned (that is EB-1A)
- Do NOT recommend EB-1B for corporate employees at non-research companies (managers, accountants, software engineers at tech companies, etc.)
- When the applicant works in industry (not academia), recommend EB-1A instead of EB-1B
```

### 3. Fix Indian Backlog Data
Add to system prompt:

```
Country-Specific EB Backlogs (CRITICAL - must be accurate):
- India EB-2: 10+ years (longest of any country, far worse than China)
- India EB-3: 10+ years (similarly severe)
- China EB-2: 3-5 years
- China EB-3: 5-8 years
- China EB-5 (traditional): 8-15 years
- China EB-5 (set-aside/rural): Currently no backlog
- Philippines: Generally current (no significant backlog) for most categories
- All other countries: Generally current or short backlog

NEVER state that India has shorter backlogs than China for EB categories. The opposite is true.
```

### 4. Add OPT/CPT Requirements for F-1 Students
Add to system prompt:

```
For F-1 students seeking work authorization:
ALWAYS mention these options FIRST before H-1B or green card paths:
1. CPT (Curricular Practical Training) — work authorization during studies, requires academic connection
2. OPT (Optional Practical Training) — 12 months post-graduation for all fields
3. STEM OPT Extension — additional 24 months (36 total) for STEM degree holders only
4. Non-STEM fields (business, humanities, arts) get only 12 months OPT

H-1B requires employer sponsorship AND lottery selection (~25-30% chance). F-1 students should plan OPT first.
```

### 5. Fix Employer Sponsorship Data Integrity
Add to system prompt:

```
CRITICAL: Check the hasEmployerSponsor field carefully.
- If "否" (no): Do NOT state or imply that the employer has confirmed sponsorship. Note in recommendations that finding a willing employer is a prerequisite.
- If "是" (yes): May reference confirmed sponsorship.
- If "自雇" (self-employed): Note that most visa categories require traditional employer-employee relationship.
```

### 6. Add E-2 Treaty Eligibility Check
Add to system prompt:

```
E-2 Treaty Investor Visa:
- China (mainland) does NOT have an E-2 treaty with the US. Mark as "NOT ELIGIBLE" for Chinese mainland nationals.
- Do NOT rate E-2 as "medium" or "low" for Chinese nationals. It is simply not available.
- Only mention E-2 if the applicant has dual citizenship with a treaty country.
- Taiwan and Hong Kong SAR passport holders may be eligible (check current treaty list).
```

### 7. Add Schedule A for Nurses
Add to system prompt:

```
For registered nurses (RN):
ALWAYS mention Schedule A Group I, which pre-certifies nurses for PERM labor certification.
This means nurses do NOT need to go through the full PERM recruitment process, significantly shortening the green card timeline.
Also mention VisaScreen certificate requirement (CGFNS).
```

### 8. Add Unlawful Presence Warning Template
Add to system prompt:

```
For applicants with overstay/unlawful presence status:
MUST clearly explain:
- 180 days - 1 year unlawful presence → 3-year bar from re-entry if they depart the US
- 1+ year unlawful presence → 10-year bar from re-entry if they depart the US
- Adjustment of status in the US is generally only available to immediate relatives of USC or those covered by INA 245(i)
- Recommend NOT leaving the US until consulting an attorney
- I-601A provisional waiver may be available for certain cases
```

### 9. Add EB-2 NIW as Standard Recommendation
Add to system prompt:

```
EB-2 NIW (National Interest Waiver):
- Self-petition (no employer required)
- Especially strong for STEM professionals, researchers, healthcare workers
- Uses Dhanasar framework (2016): proposed endeavor has substantial merit and national importance; well-positioned to advance it; beneficial to waive job offer requirement
- ALWAYS recommend NIW as an option for PhD holders, STEM professionals with publications, and healthcare workers
- Chinese-born EB-2 NIW has same backlog as regular EB-2 (~3-5 years)
```
