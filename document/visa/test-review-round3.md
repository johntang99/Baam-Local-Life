# Round 3 Test Review — Visa Screener Quality Audit

**Date**: 2026-04-01
**Tests**: 20 scenarios (testId 1–20)
**Failures identified by test agent**: 12

---

## Overall Quality Rating: 5.5 / 10

The system handles straightforward cases (CR-1/IR-1 distinction, O-1 for artists, EB-1A for strong PhD candidates, Taiwan EB-1C) reasonably well. However, it fails on critical legal rules — petitioner age requirements, LPR petition scope, EB-5 awareness, widow provisions, AC21 portability, naturalization timing, OPT expiry urgency, professional licensing, agricultural visa classification, and the Bachelor's+5yr EB-2 path. These are not edge cases; they are foundational immigration law concepts that a screener must get right.

---

## Failure Analysis & Prompt Fixes

### 1. Petitioner Age Rules (Test 1, Test 12)

**What happened**: Test 1 — User is a 60-year-old parent, USC son is 35. AI returned IR-2 (minor child of USC) as the top result instead of IR-5 (parent of USC). The AI treated the *parent* as if they were the child. Test 12 — USC daughter is 15. AI failed to state that a USC child must be 21+ to file I-130 for a parent. Instead it suggested IR-2 and IR-5 as if the 15-year-old could petition now.

**Root cause**: The AI does not enforce the rule that only a USC aged 21 or older can petition for a parent (IR-5). It also confuses the direction of the petition — who is the petitioner vs. the beneficiary.

```
【美国公民子女为父母申请的年龄规则】
当用户是父母、家属是美国公民子女（子女 Child）时，适用以下规则：
- IR-5（美国公民的父母）：美国公民子女必须年满21岁才能为父母提交I-130申请。这是法律硬性要求。
- 如果美国公民子女未满21岁，必须明确告知用户："您的子女目前未满21岁，根据美国移民法，未满21岁的美国公民无法为父母申请移民（I-130）。您的子女需要等到21岁才能为您提交申请。"
- 绝对不要将IR-2（美国公民的未婚未成年子女）推荐给作为父母的用户。IR-2是父母为子女申请的类别，不是子女为父母申请的类别。
- 注意请愿方向：父母是受益人(beneficiary)，美国公民子女是请愿人(petitioner)。不要混淆方向。
```

---

### 2. LPR Petition Limitations (Test 2)

**What happened**: User's brother is an LPR (not USC). AI recommended F-2A, IR-5, and F-4 — all of which are irrelevant or require USC status. It failed to state the fundamental rule: LPR cannot petition for siblings. Instead it hedged by saying "if your family member naturalizes..."

**Root cause**: The AI does not have a hard constraint defining the exact scope of LPR petition rights. It "helpfully" suggests categories that would apply if the LPR naturalized, which is misleading.

```
【绿卡持有者（LPR）的申请范围限制】
绿卡持有者（LPR）只能为以下亲属申请移民：
- F-2A：配偶和未婚未成年子女（21岁以下）
- F-2B：未婚成年子女（21岁以上）

LPR绝对不能为以下亲属申请：
- 父母 — 不可以
- 兄弟姐妹 — 不可以
- 已婚子女 — 不可以

当用户的美国家属是LPR（非公民），且关系为父母、兄弟姐妹或已婚子女时，必须明确告知：
"绿卡持有者无法为[父母/兄弟姐妹/已婚子女]申请移民。只有美国公民才有此资格。如果您的家属将来入籍成为美国公民，届时可以申请。"

不要推荐需要美国公民身份的类别（如IR-5、F-4）作为主要选项。可以在notes中提及入籍后的可能性，但必须首先明确当前不可行。
```

---

### 3. EB-5 Awareness (Test 9)

**What happened**: User explicitly stated they are an EB-5 investor with a filed I-526 and PD 2019 in a TEA regional center project. The AI completely ignored EB-5 and instead recommended H-1B, EB-3, EB-2, and L-1A. It did not mention EB-5 at all, did not discuss China EB-5 backlog, and did not mention the set-aside visa categories (rural TEA, high unemployment TEA, infrastructure).

**Root cause**: The AI has no awareness of EB-5 categories or the 2022 EB-5 Reform and Integrity Act set-aside provisions. When the user mentions I-526, investment, or EB-5, the system fails to route to the correct category.

```
【EB-5投资移民识别与优先处理】
当用户提及以下任何关键词时，必须优先推荐EB-5相关类别：I-526、I-526E、EB-5、投资移民、区域中心(regional center)、TEA、目标就业区。

EB-5关键信息：
- 最低投资额：$1,050,000（标准）或 $800,000（目标就业区TEA）
- 必须创造10个全职就业机会
- 2022年EB-5改革法案(EB-5 Reform and Integrity Act)引入了set-aside签证名额：
  - 农村TEA项目(Rural TEA)：每年预留20%的EB-5签证，目前无排期（包括中国出生申请人）
  - 高失业率TEA项目：每年预留10%
  - 基础设施项目：每年预留2%
- 中国出生EB-5申请人在传统（非set-aside）类别中面临严重排期（约8-15年）
- 如果用户已提交I-526/I-526E：询问投资类型（区域中心vs直投）、TEA类型（农村vs高失业率）、优先日期，以提供准确的排期估计
- 农村TEA set-aside对中国申请人是重大利好：目前无排期，是绕过中国EB-5排期的最佳策略

如果用户已有pending的I-526且投资于非农村TEA项目，建议咨询律师评估是否可以通过新的I-526E申请转入农村TEA set-aside类别以加速处理。
```

---

### 4. Widow(er) Provision (Test 17)

**What happened**: User is the widow of a USC, married 10 years, husband recently deceased. The AI completely missed the widow/widower self-petition provision under INA 201(b)(2)(A)(i). Instead it recommended EB-3, EB-5, and F-1 student visa — completely irrelevant. This is a critical failure; the user has a direct path to a green card.

**Root cause**: The system has zero awareness of the widow(er) provision. This is a well-known immigration law provision that the screener must recognize.

```
【美国公民遗孀/鳏夫自请愿规定】
根据INA § 201(b)(2)(A)(i)，美国公民的遗孀或鳏夫可以自行申请移民（无需在世的请愿人）。

适用条件：
- 申请人与已故美国公民合法结婚
- 婚姻持续至少2年（在公民去世之前）
- 申请人在美国公民去世后2年内提交I-360自请愿书
- 申请人未再婚

关键信息：
- 这是直系亲属类别(Immediate Relative)，无排期
- 处理时间约8-14个月
- 无需经济担保人（因请愿人已故）
- 配偶去世前是否已提交I-130不影响资格

当用户提及以下情况时，必须优先推荐此类别：
- 配偶是美国公民且已去世/过世/死亡
- 提及"遗孀"、"寡妇"、"丧偶"、"widow"等关键词
- 提及已故的美国公民丈夫/妻子

回复时务必告知：
1. 自请愿权利（I-360表格）
2. 2年申请期限（从公民去世日起算）
3. 不得再婚的要求
4. 建议立即咨询律师，因为有严格的时间限制
```

---

### 5. AC21 Portability (Test 19)

**What happened**: User has an approved I-140, I-485 pending 180+ days, and employer is going bankrupt. This is a textbook AC21 portability scenario. The AI completely ignored AC21, did not mention portability, and instead recommended starting a new EB-2 PERM process from scratch. It also failed to mention that an approved I-140 remains valid even if the employer goes bankrupt (per 2017 USCIS policy).

**Root cause**: No AC21 awareness in the system prompt. The AI treats every green card question as a fresh application rather than considering the user's existing pending case.

```
【AC21工作转换可携带性规则】
AC21（21世纪美国竞争力法案）允许I-485身份调整申请人在满足条件后更换雇主：

适用条件：
- I-140已获批准
- I-485已pending满180天或以上
- 新工作必须与原I-140申请的职位属于相同或相似的职业分类(same or similar occupational classification)

关键规则：
1. 符合AC21条件的申请人可以自由更换雇主，绿卡申请继续有效
2. 即使原雇主撤回I-140，只要I-140已批准满180天，I-140仍然有效
3. 即使原雇主破产、倒闭、裁员，已批准的I-140不受影响（2017年USCIS政策确认）
4. 优先日期(Priority Date)保留不变
5. 申请人需向USCIS提交AC21转换通知（通常通过律师）

当用户提及以下情况时，必须检查是否适用AC21：
- I-485已pending + 想换工作/被裁员/雇主破产
- 已有approved I-140 + 雇主问题
- 提及"portability"、"换雇主"、"AC21"等关键词

回复必须包含：
1. 确认是否满足AC21条件（I-140批准 + I-485 pending 180+天）
2. 明确告知可以更换雇主且绿卡申请不受影响
3. 新工作需同类或相似职位
4. 建议立即咨询律师处理AC21转换手续
5. 如雇主破产：明确告知I-140仍然有效，不需要重新开始申请
```

---

### 6. Naturalization Eligibility (Test 15)

**What happened**: User has green card for 4 years, NOT married to USC, asking if they qualify now. The AI correctly listed the 5-year and 3-year rules in the requirements but failed to apply them to the user's situation. It rated N-400 as "high" match and did not clearly state: "You do NOT qualify yet. You need 5 years as LPR, and you only have 4. You must wait 1 more year." The notes say "congratulations, you're in the final stage" which is misleading.

**Root cause**: The AI lists rules but does not evaluate them against the user's stated facts. It should compute eligibility and give a clear yes/no answer.

```
【入籍资格时间要求 — 必须明确评估】
入籍(N-400)时间要求：
- 一般规则：绿卡持有满5年
- 与美国公民结婚：绿卡持有满3年（且婚姻关系持续）

当用户申请入籍评估时，必须：
1. 确认绿卡持有年数
2. 确认是否与美国公民结婚
3. 明确计算并告知是否满足时间要求

如果不满足时间要求，必须明确声明：
"您目前持绿卡[X]年，[未与美国公民结婚/与美国公民结婚]。入籍要求为[5年/3年]。您目前尚不符合入籍条件，需要再等待[Y]年。您最早可以在绿卡满[5年/3年]前90天提交N-400申请。"

不要将不符合条件的情况标记为"high"匹配度。如果用户明确不满足时间要求，应标记为"medium"或"low"，并在描述中注明等待时间。
```

---

### 7. OPT Status Awareness (Test 14)

**What happened**: User's OPT has expired, they are in the 60-day grace period, H-1B lottery was not selected, no employer sponsor. The AI recommended applying for OPT and STEM OPT extension as if the user had not yet applied. It completely missed that OPT is already expired. During the 60-day grace period, the user cannot work and has very limited options.

**Root cause**: The AI does not parse the user's current status carefully. When someone says "OPT已到期" (OPT expired) and "60天宽限期" (60-day grace period), the system should recognize this as an urgent, time-limited situation with very different options than a current OPT holder.

```
【OPT到期/宽限期的紧急处理】
当用户表示OPT已到期、在60天宽限期内、或OPT即将到期时：

关键事实：
- 60天宽限期内不能工作
- 不能重新申请OPT（OPT是一次性的，每个学位层级只能用一次）
- 如果已经用过STEM OPT延期，不能再延期

在60天宽限期内的选项（按紧急程度排列）：
1. Cap-gap延期：如果H-1B申请已提交且被选中（petitioned），OPT自动延期至10月1日H-1B生效。如果未被选中，此项不适用。
2. 身份转换(Change of Status)：在宽限期内可以申请转换为其他身份（如F-1开始新学位、B-2旅游签证等）
3. 新学位层级的F-1：如果入学攻读更高学位（如硕士转博士），可获得新的F-1身份和未来新的OPT资格
4. 离开美国：如果以上选项都不可行，必须在60天宽限期结束前离开美国，否则开始累积非法居留时间

绝对不要推荐：
- "申请OPT" — 如果OPT已到期，不能重新申请
- "申请STEM OPT延期" — 如果OPT已到期，延期窗口已过
- 任何需要长时间处理的选项（宽限期只有60天）

必须在回复中强调紧急性和时间限制。
```

---

### 8. Foreign Professional Licensing (Test 16)

**What happened**: Korean dentist with DDS wants to practice in the US. The AI recommended O-1 and EB-1A as top choices but completely failed to mention the most critical practical requirement: US dental licensing. Foreign dentists cannot practice in the US without passing NBDE/INBDE exams and obtaining state licensure. The AI treated it purely as an immigration question without addressing the professional licensing prerequisite.

**Root cause**: The system does not consider that certain professions require US credential evaluation and licensing before the immigration path becomes viable.

```
【外国专业人士执照与资质要求】
以下职业在美国执业需要先完成学历认证和专业执照考试。推荐签证类别时必须同时告知执照要求：

牙医(Dentist/DDS)：
- 必须通过INBDE考试（前身为NBDE Part I & II）
- 大多数州要求完成美国CODA认证的牙科高级项目(Advanced Standing Program)，通常2-3年
- 各州牙医执照委员会有不同的额外要求
- 学历等同认证：通过ECE或WES进行外国学历评估

医生(Doctor/MD)：
- 必须通过USMLE Step 1、Step 2 CK、Step 3
- 必须完成美国住院医师培训(Residency)，通常3-7年
- 需要ECFMG认证
- 各州有独立的医疗执照要求

律师(Lawyer/JD)：
- 大多数州要求JD学位或LLM学位
- 必须通过州Bar考试
- 纽约州和加州对外国律师相对友好

护士(Nurse/RN)：
- 需要CGFNS认证和VisaScreen证书
- 需要通过NCLEX-RN考试
- 各州护理委员会有额外要求

当推荐签证类别给这些专业人士时，必须在notes中包含：
1. 美国执业所需的具体考试和认证
2. 预估的认证时间和成本
3. 建议在申请签证的同时开始准备执照考试
```

---

### 9. H-2A vs H-2B (Test 18)

**What happened**: Mexican agricultural worker with employer sponsor for seasonal crop harvesting. The AI recommended TN as the top "high" match, H-2B as "medium", and H-2A as "high" but listed third. TN is wrong — agricultural workers are not on the TN profession list. The correct answer is H-2A as the clear #1 choice.

**Root cause**: The AI does not properly distinguish agricultural vs non-agricultural seasonal work, and incorrectly suggests TN for a worker without a degree in a non-professional occupation.

```
【H-2A与H-2B的区分规则】
农业工作与非农业季节性工作使用不同的签证类别，绝对不能混淆：

H-2A（临时农业工人）：
- 适用于：农业、农场、种植、收获、牧场等农业工作
- 无年度配额限制
- 雇主必须提供住房和交通
- 雇主必须支付不低于Adverse Effect Wage Rate (AEWR)的工资
- 处理时间：约2-4个月

H-2B（临时非农业工人）：
- 适用于：酒店、餐饮、园艺（非农业）、建筑、旅游等季节性非农业工作
- 年度配额限制：66,000个（上半年和下半年各33,000）
- 竞争激烈，名额经常提前用完

区分规则：
- 如果工作是农业性质（种植、收获、养殖、农场管理）→ 必须推荐H-2A，不要推荐H-2B
- 如果工作是非农业季节性工作 → 推荐H-2B
- 不要向农业工人推荐TN签证（TN仅适用于USMCA专业人士列表中的职业，农业工人不在列表中）
- 不要向没有学士学位的工人推荐TN签证（TN大多数类别要求学士学位）

当用户是农业工人时，H-2A应为第一推荐（match: high），不要将其排在H-2B或TN之后。
```

---

### 10. Bachelor's + 5 Years = EB-2 (Test 4)

**What happened**: User has BS in CS + 8 years progressive experience (junior to senior to team lead), explicitly asks about the Bachelor's+5yr EB-2 rule. The AI rated EB-3 as "high" and EB-2 as only "medium", saying EB-2 "usually requires a Master's degree." It completely failed to recognize the well-established regulatory path: Bachelor's degree + 5 years of progressive post-baccalaureate experience in the specialty = EB-2 qualification under 8 CFR 204.5(k)(2).

**Root cause**: The system is not aware of the EB-2 qualification via Bachelor's + 5 years progressive experience. It only associates EB-2 with Master's degree.

```
【EB-2资格：学士学位 + 5年渐进式工作经验】
EB-2（职业移民第二类）有两种资格路径：
1. 高等学位：硕士或以上学位
2. 学士学位 + 5年渐进式工作经验：根据8 CFR § 204.5(k)(2)，学士学位加上5年或以上的渐进式专业工作经验(progressive post-baccalaureate experience)等同于硕士学位，符合EB-2资格

"渐进式工作经验"的含义：
- 职责和复杂度随时间递增（如从初级→高级→团队负责人→经理）
- 经验必须在学士学位获得之后
- 经验必须在申请的专业领域内
- 5年是最低要求

当用户具有学士学位 + 5年以上渐进式工作经验时：
- EB-2应评为HIGH匹配度，不是MEDIUM
- 明确告知用户此资格路径的存在
- 不要将此类用户默认归入EB-3
- 这是一条成熟且被广泛认可的EB-2资格路径，不是例外情况

示例回复："虽然您只有学士学位，但您的8年渐进式工作经验（从初级到高级到团队负责人）完全符合EB-2的'学士+5年渐进式经验'资格标准（8 CFR § 204.5(k)(2)）。这意味着您可以直接申请EB-2，而非EB-3。"
```

---

### 11. EB-1B for Academic Postdocs (Test 20)

**What happened**: Chemistry PhD completing degree, has university postdoc offer, university willing to sponsor, 5-10 publications. The AI rated EB-1B as only "medium" and ranked it last among 4 options (behind EB-1A "high", EB-2 "high", EB-2 NIW "high"). University postdoc researcher is a textbook EB-1B case — the category was literally designed for this scenario. EB-1B should be "high" and prominently featured.

**Root cause**: The system undervalues EB-1B and over-indexes on EB-1A even when the user explicitly says they do NOT claim extraordinary ability (hasExtraordinaryAchievements: false). EB-1B has a lower bar than EB-1A and is specifically for outstanding professors and researchers at universities/research institutions.

```
【EB-1B杰出教授/研究人员 — 学术岗位优先推荐】
EB-1B（杰出教授或研究人员）是专门为大学和研究机构的学术人员设计的绿卡类别。

EB-1B理想候选人特征：
- 在大学、学院或研究机构工作（或即将入职）
- 博士学位
- 至少3年研究/教学经验（博士期间的研究经验计入）
- 有同行评审期刊论文发表
- 雇主（大学/研究机构）愿意sponsor

EB-1B vs EB-1A的区别：
- EB-1A要求"杰出能力"(extraordinary ability)，标准更高
- EB-1B要求"杰出研究人员"(outstanding researcher)，标准相对较低
- EB-1B需要雇主sponsor，EB-1A不需要
- 两者排期相同（同属EB-1类别）

EB-1B评估标准（满足2项即可）：
1. 获得重大奖项或荣誉
2. 学术协会会员资格
3. 他人在专业出版物中引用/评论其工作
4. 担任期刊评审或编辑
5. 原创性科学/学术贡献
6. 撰写的学术书籍或文章

关键规则：
- 当用户在大学做博士后(postdoc)且雇主愿意sponsor时，EB-1B应评为HIGH匹配度
- 不要因为用户表示"没有杰出能力"(hasExtraordinaryAchievements=false)就降低EB-1B评级。EB-1B的门槛低于EB-1A，不需要用户自认"杰出"
- 大学博士后 + PhD + 论文发表 = 教科书式的EB-1B案例
- 当同时推荐EB-1A和EB-1B时，如果用户不声称杰出能力，EB-1B应排在EB-1A前面
```

---

## Tests That Passed (No Issues)

| Test | Scenario | Notes |
|------|----------|-------|
| 3 | Canadian software engineer | Correctly recommended TN first with H-1B secondary |
| 5 | Award-winning pianist, F-1 | O-1 high, EB-1A high — correct |
| 6 | CR-1 vs IR-1 (married 3 months) | Correctly distinguished CR-1 and IR-1 |
| 7 | Indian RN nurse, Schedule A | Correctly identified Schedule A Group I, EB-3 path |
| 8 | B1/B2 overstay, asylum | Covered asylum, withholding, CAT; mentioned 1-year deadline |
| 10 | Hong Kong BNO, E-2 restaurant | Correctly identified E-2 treaty eligibility |
| 11 | PhD AI/ML, strong profile | EB-1A high — correct for this strong profile |
| 13 | Taiwan L-1A to EB-1C | Correctly recommended EB-1C, noted Taiwan no backlog |

---

## Summary of All 12 Failures

| # | Test | Issue | Severity |
|---|------|-------|----------|
| 1 | Test 1 | Recommended IR-2 instead of IR-5 for parent; confused petition direction | CRITICAL |
| 2 | Test 2 | Failed to state LPR cannot petition siblings | CRITICAL |
| 3 | Test 4 | Rated EB-2 as MEDIUM for BS+8yr; missed Bachelor+5yr rule | HIGH |
| 4 | Test 9 | Completely ignored EB-5 when user explicitly mentioned I-526 | CRITICAL |
| 5 | Test 12 | Failed to state USC child must be 21+ to petition parent | CRITICAL |
| 6 | Test 14 | Recommended applying for OPT when OPT already expired | CRITICAL |
| 7 | Test 15 | Did not clearly state user needs 1 more year for naturalization | HIGH |
| 8 | Test 16 | No mention of INBDE/dental licensing requirements | HIGH |
| 9 | Test 17 | Completely missed widow(er) self-petition provision | CRITICAL |
| 10 | Test 18 | Recommended TN over H-2A for agricultural worker | HIGH |
| 11 | Test 19 | Completely missed AC21 portability; suggested starting over | CRITICAL |
| 12 | Test 20 | Rated EB-1B as MEDIUM for textbook postdoc case | MEDIUM |

**Severity breakdown**: 6 CRITICAL, 5 HIGH, 1 MEDIUM

---

## Implementation Priority

1. **Immediate (blocks launch)**: Fixes 1, 2, 4, 5, 6, 9, 11 — these involve the AI giving outright wrong answers or missing the user's stated situation entirely
2. **High priority**: Fixes 3, 7, 8, 10 — the AI gives partially correct but misleading or incomplete answers
3. **Normal priority**: Fix 12 — rating is wrong but the correct category was at least mentioned
