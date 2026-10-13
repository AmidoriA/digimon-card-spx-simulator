# TS-106: ออกแบบ stat และ effect ใหม่ครบ 45 ใบ

**เวอร์ชัน:** 1 · **เจ้าของขอ:** 2026-10-14 · **สถานะ:** ใส่ในเกมและผ่านการตรวจ

ตัวเลขและการแปลงประวัติเป็นเอฟเฟกต์เป็นการออกแบบใหม่ของโปรเจกต์ ไม่ใช่ค่าใน
Time Stranger หรือการแปลกลไกจากเกมนั้นโดยตรง ประวัติย่ออ้างอิง Digimon Reference Book
เป็นข้อเท็จจริงเรื่องสายพันธุ์ การตีความเป็นการ์ดอธิบายแยกในแต่ละแถว
ใช้ชื่อท่าที่ตรวจสอบไว้ใน [attack-sources.md](attack-sources.md)

HP, DP, +P และพลังทั้งสามถูกเลือกใหม่ทั้งชุด; Rookie ยังคง DP 0 และค่า +P มาตรฐาน
อาจตรงต้นแบบได้ แต่ไม่มีใบใดใช้ stat profile, ✕ effect หรือ support เดิมทั้งชุด
ทุกใบมี ✕ effect ต่างจากรุ่นก่อน และ support มีส่วนผสม/เงื่อนไขต่างกันทั้ง 45 ใบ
ตัว ✕ effect เลือกจาก 16 แบบที่เกมรองรับ จึงซ้ำประเภทกันได้ ไม่ได้เพิ่ม 45 กฎใหม่

## หลักบาลานซ์

- เปรียบเทียบการ์ดบนดิสก์สีและระดับเดียวกัน; ไม่ลดต้นทุน DP เพื่อชดเชย model ต้นแบบ
- Fire บุกสูง, Ice ทนสูง, Nature มี +P/การฟื้น/การเติบโต, Darkness มีความเสี่ยงและการก่อกวน,
  Rare ให้รางวัลการอ่านจังหวะและคุมทรัพยากร ยังคง Specialty ที่ยืนยันใน roster
- คู่ counter มีพลัง ✕ 0: ถ้าทายผิดย่อมเสียโอกาสโจมตี; Crash แลก HP เหลือ 10 ตามเกม
- Support ใช้ใบจากมือ/เด็คแล้วเสียใบนั้นเอง ไม่มีพลังแฝงฟรีเมื่อเป็นตัว active
- บัฟ/ดีบัฟพลัง, การสวน, ชิงจังหวะ และ flag ต่าง ๆ ใช้ในศึกปัจจุบันเท่านั้น;
  HP, การ์ดที่จั่ว/ทิ้ง และการเปลี่ยน Specialty เป็นการเปลี่ยน state จริงตามกฎเดิม
  Renamon เปลี่ยนสีจนกว่าจะวิวัฒนาการ/ออกจากสนาม ไม่คืนสีเมื่อจบเทิร์น
  ไม่มี burn, freeze, sleep หรือ poison หลายเทิร์น
- Jamming/void ในชุดนี้หยุดเฉพาะ Digimon support ไม่หยุด Option support;
  HP จากการรีไวฟ์ยังเสียแต้มและไม่กู้ KO ที่ตัดสินแมตช์ตามกฎเดิม
- ตัวเลขนี้คือ tuning เริ่มต้นที่มีเหตุผลรองรับ การทดสอบพิสูจน์พฤติกรรม/ไม่ค้าง
  ยังไม่ใช่หลักฐานว่าเด็คทั้ง 15 สมดุลเท่ากัน; ต้อง playtest Phase 3 ต่อ

## ช่วงที่ใช้เปรียบเทียบ

ช่วง HP/DP/+P และพลังโจมตีของการ์ดเดิมทั้งหมดในแต่ละสี/ระดับอ่านจาก cards.js
ตัวเลข HP และพลังของชุดใหม่อยู่ภายในช่วงดังกล่าวทุกใบ (DP/+P ใช้ค่าของ tier นั้น)
ไฟล์ tools/time_stranger_design_test.js ตรวจกรอบนี้และผลของ support จริง

## วิธีอ่าน

R / C / U = Rookie / Champion / Ultimate; พลังเรียง ○ / △ / ✕.
ข้อความ support ภาษาอังกฤษด้านล่างตรงกับที่เกมแสดง; เงื่อนไขอ่านหลังเปิดใช้ support
จึงนับมือโดยไม่นับใบ support ที่ใช้ไปแล้ว ค่าลดพลังมีพื้น 0 ตามเกม

## Fire — บุกหนัก / ชิงจังหวะ / แลกทรัพยากรเพื่อไฟ

| Id | Card / Lv | HP | DP | +P | ○ / △ / ✕ | ✕ effect |
|---|---|---:|---:|---:|---|---|
| 302 | Guilmon / R | 590 | 0 | 20 | 370 / 230 / 140 | 1st Attack |
| 303 | Coronamon / R | 520 | 0 | 20 | 360 / 250 / 120 | ○ to 0 |
| 304 | Huckmon / R | 560 | 0 | 20 | 340 / 270 / 0 | △ Counter |
| 305 | Growlmon / C | 920 | 40 | 10 | 590 / 430 / 180 | Ice Foe x3 |
| 306 | Firamon / C | 780 | 30 | 20 | 540 / 400 / 160 | 1st Attack |
| 307 | BaoHuckmon / C | 850 | 40 | 10 | 580 / 450 / 0 | ○ Counter |
| 308 | WarGrowlmon / U | 1620 | 50 | 10 | 890 / 670 / 250 | Crash |
| 309 | Flaremon / U | 1480 | 40 | 20 | 800 / 610 / 280 | Jamming |
| 310 | SaviorHuckmon / U | 1450 | 50 | 20 | 860 / 650 / 300 | 1st Attack |

### Guilmon (302)

**Support:** If own Specialty is Fire, boost own ○ Attack Power +250.

**แนวคิด:** นักบุกระยะประชิด: กรงเล็บแรงและไฟกดดัน เน้น ○; ไม้ตายรองยังมีพลังให้เลือก

**Lore:** A ferocious young reptile with stone-breaking claws and fire breath. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=guilmon).

### Coronamon (303)

**Support:** If own HP are more than 100, lose 100 HP and boost own Attack Power +250.

**แนวคิด:** แลก HP เพื่อเร่งไฟ; ✕ เป็นเกราะไฟตัด ○ แลกกับ HP เริ่มต้นต่ำ

**Lore:** Its flame shot consumes stamina; a whole-body flame cloak also defends it. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=coronamon).

### Huckmon (304)

**Support:** If own Attack is △, boost own △ Attack Power +100 and attack first.

**แนวคิด:** นักดาบฝึกหัด: △ คล่องตัวและสวนทาง △; จ่ายพลังโจมตี ✕ เพื่อความสามารถสวน

**Lore:** Trained by Gankoomon and Sistermon, it relies on nimble close combat and aspiration. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=huckmon).

### Growlmon (305)

**Support:** If own Specialty is Fire, lower opponent's Attack Power -150 and boost own ○ Attack Power +100.

**แนวคิด:** มังกรขู่ศัตรู: HP สูงกว่าสายเร็ว ลดพลังคู่ต่อสู้ก่อนโจมตีด้วยไฟ

**Lore:** Its ferocity and powerful roar intimidate foes before its blades and explosive flame attack. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=growmon).

### Firamon (306)

**Support:** If own Specialty is Fire, boost own Attack Power +150 and draw 1 Card.

**แนวคิด:** สิงโตบินจู่โจม: เข้าเกมไวแต่ HP ต่ำ; support ช่วยทีมบุกและเติมมือ

**Lore:** A flying lion and helpful leader protecting ruins, diving from above wrapped in flame. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=firamon).

### BaoHuckmon (307)

**Support:** If own Attack is △, boost own △ Attack Power +200 and attack first.

**แนวคิด:** นักสู้มีวินัย: △ เป็นคอมโบเร็ว; ✕ ใช้ Blazing Flame สวน ○ โดยตรง

**Lore:** Strict training refines independent tactical judgment; Blazing Flame serves as a counter. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=baohuckmon).

### WarGrowlmon (308)

**Support:** If own Specialty is Fire and 3 or more Cards remain in own Online Deck, discard 3 Cards from own Online Deck and boost own Attack Power +350.

**แนวคิด:** อาวุธหนัก: stat สูงแลก DP 50; support ใช้เชื้อเพลิงจากเด็ค และ Crash เสี่ยงเหลือ HP 10

**Lore:** A huge armored cyborg with restrained immense power and twin atomic guns. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=megalogrowmon).

### Flaremon (309)

**Support:** If own Specialty is Fire, recover own HP +250 and boost own Attack Power +150.

**แนวคิด:** ไฟคุ้มครองเพื่อน: ฟื้นตัวพร้อมบุก; เสียงคำราม ✕ ล้าง Digimon support ฝ่ายตรงข้าม

**Lore:** A courageous friend with martial flame attacks and a purifying howl that fragments hostile data. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=flaremon).

### SaviorHuckmon (310)

**Support:** If own HP are less than opponent's HP, recover own HP +200 and boost own Attack Power +400.

**แนวคิด:** ผู้ช่วยฝ่ายเสียเปรียบ: support แรงเฉพาะตอน HP น้อยกว่า; stat บุกสูงแต่ไม่ใช่สาย tank

**Lore:** Its travels strengthen a resolve to aid victims of conflict; blades and rapid flames become more offensive. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=saviorhuckmon).

## Ice — HP สูง / ปิดท่า / เปลี่ยนจังหวะ / สวนกลับ

| Id | Card / Lv | HP | DP | +P | ○ / △ / ✕ | ✕ effect |
|---|---|---:|---:|---:|---|---|
| 311 | Gaomon / R | 680 | 0 | 20 | 320 / 230 / 160 | 1st Attack |
| 312 | Lunamon / R | 710 | 0 | 20 | 300 / 210 / 140 | ○ to 0 |
| 313 | Syakomon / R | 770 | 0 | 20 | 280 / 200 / 0 | ○ Counter |
| 314 | Gaogamon / C | 1120 | 40 | 10 | 450 / 310 / 170 | 1st Attack |
| 315 | Lekismon / C | 980 | 40 | 20 | 430 / 350 / 150 | ○ to 0 |
| 316 | Octomon / C | 1230 | 40 | 10 | 400 / 280 / 170 | Jamming |
| 317 | MachGaogamon / U | 1900 | 50 | 10 | 750 / 550 / 260 | 1st Attack |
| 318 | Crescemon / U | 1820 | 40 | 20 | 650 / 490 / 240 | △ to 0 |
| 319 | Dragomon / U | 2180 | 50 | 10 | 680 / 410 / 280 | Jamming |

### Gaomon (311)

**Support:** If own Specialty is Ice and own Attack is △, attack first and lower opponent's ○ Attack Power -100.

**แนวคิด:** มวยคล่องตัว: ใช้ความเร็วในธีม Ice คุมจังหวะและลดหมัด ○ ของคู่ต่อสู้

**Lore:** A nimble boxer specializing in hit-and-run and rapid punches. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=gaomon).

### Lunamon (312)

**Support:** If own Specialty is Ice, recover own HP +150 and lower opponent's △ Attack Power -80.

**แนวคิด:** กระต่ายจันทร์: ฟองน้ำป้องกันและประคอง HP; พลังโจมตีต่ำกว่าสายมวย

**Lore:** A timid moon-born rabbit with water shots and a bubble vortex from its ears. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=lunamon).

### Syakomon (313)

**Support:** If own HP are 500 or less, halve opponent's Attack Power.

**แนวคิด:** เปลือกหอยรับแรง: HP สูงและสวน ○; support ลดความแรงเมื่อเริ่มบาดเจ็บ ไม่ป้องกันเต็มตั้งแต่แรก

**Lore:** Its sturdy closed shell repels attacks, concealing a deceptive soft body. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=shakomon).

### Gaogamon (314)

**Support:** If own Specialty is Ice and own Attack is ○, boost own ○ Attack Power +150 and attack first.

**แนวคิด:** หมาป่าวิ่งเข้าประชิด: ○ เป็นจุดเด่น; ได้ความไวแต่จ่าย DP สูงกว่าสาย support

**Lore:** It closes distance faster than foes can follow, then uses claws, a persistent bite and spiral wind. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=gaogamon).

### Lekismon (315)

**Support:** If own Specialty is Ice, lower opponent's ○ Attack Power to 0 and recover own HP +100.

**แนวคิด:** นักล่าจันทรา: ฟองสะกดทำให้ ○ ใช้ไม่ได้ในศึกนี้; ไม่มีสถานะหลับหลายเทิร์น

**Lore:** An agile jumper whose water bubbles hypnotize foes and whose ice arrows attack at range. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=lekismon).

### Octomon (316)

**Support:** If own Specialty is Ice, draw 2 Cards and lower opponent's Attack Power -100.

**แนวคิด:** นักสะสมใต้ทะเล: จั่วเพื่อสะสมทรัพยากร หมึกพิษลดพลังทันที; HP สูงแต่โจมตีเบา

**Lore:** A treasure collector with danger-sensing symbiotic shellfish and poisonous ink. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=octmon).

### MachGaogamon (317)

**Support:** If own Specialty is Ice, boost own △ Attack Power +200 and attack first.

**แนวคิด:** นักมวยจรวด: เร่ง △ และชิงโจมตีก่อน; พลังมากแต่ DP 50 และ +P 10

**Lore:** Rocket bursts power hit-and-run, lightning-fast combinations and a heavy finishing punch. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=machgaogamon).

### Crescemon (318)

**Support:** If own Specialty is Ice and own Attack is △, double own △ Attack Power.

**แนวคิด:** นักธนูจันทร์: จำลองพลังใต้จันทร์ด้วย △ x2 แบบมีเงื่อนไข; ○ เบากว่าสายมวย

**Lore:** Fluid dance steps confuse foes; moonlight is said to double its strength, and its weapons form an ice bowgun. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=crescemon).

### Dragomon (319)

**Support:** If own Specialty is Ice, change opponent's Attack from ○ to △, △ to ✕, or ✕ to ○, then lower opponent's Attack Power -200.

**แนวคิด:** เจ้าแห่งทางเดินผิด: บังคับวนท่าคู่ต่อสู้และกดพลัง; HP สูงแลก DP และการโจมตีรองต่ำ

**Lore:** A sea-floor deity associated with a virus that sends ships off course, using a powerful trident. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=dagomon).

## Nature — ฟื้นตัว / +P สูง / ใช้ DP สีเดียวกันสะสมพลัง

| Id | Card / Lv | HP | DP | +P | ○ / △ / ✕ | ✕ effect |
|---|---|---:|---:|---:|---|---|
| 320 | Renamon / R | 580 | 0 | 20 | 330 / 230 / 0 | ○ Counter |
| 321 | Terriermon / R | 630 | 0 | 30 | 310 / 210 / 140 | 1st Attack |
| 322 | Lalamon / R | 650 | 0 | 30 | 290 / 200 / 100 | ○ to 0 |
| 323 | Kyubimon / C | 840 | 30 | 30 | 400 / 310 / 180 | Jamming |
| 324 | Gargomon / C | 950 | 40 | 20 | 530 / 390 / 190 | ✕ to 0 |
| 325 | Sunflowmon / C | 910 | 30 | 30 | 450 / 280 / 180 | Eat-up HP |
| 326 | Taomon / U | 1560 | 40 | 30 | 740 / 530 / 220 | Jamming |
| 327 | Rapidmon / U | 1440 | 50 | 20 | 820 / 600 / 260 | 1st Attack |
| 328 | Lilamon / U | 1690 | 40 | 30 | 680 / 450 / 240 | △ to 0 |

### Renamon (320)

**Support:** Change own Specialty to opponent's Specialty and draw 1 Card.

**แนวคิด:** จิ้งจอกเลียนแบบ: support เปลี่ยนสีตามศัตรูเพื่อพลิก matchup; ✕ เป็นการสวนเชิงเทคนิค

**Lore:** Calm techniques prioritize speed over power; Kohenkyo copies appearance and overwrites texture. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=renamon).

### Terriermon (321)

**Support:** If own Specialty is Nature, add number of Nature Cards in own DP Slot x40 to own Attack Power and draw 1 Card.

**แนวคิด:** คู่หูประสานพลัง: +P 30 และ support โตตาม Nature ใน DP; พลังเดี่ยวต่ำกว่าสายบุก

**Lore:** Calm, apparently harmless, but strong in combat; Double Typhoon is a twin cooperative move. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=terriermon).

### Lalamon (322)

**Support:** If own Specialty is Nature, recover own HP +150 and draw 1 Card.

**แนวคิด:** เมล็ดพันธุ์ตั้งทีม: ฟื้น HP และเติมมือ; เพลงกล่อมแทนด้วยการตัด ○ ในศึกปัจจุบัน

**Lore:** A drifting flower bud with accurate seeds and a song that lulls foes to sleep. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=lalamon).

### Kyubimon (323)

**Support:** If own Specialty is Nature, lower opponent's Attack Power -150 and recover own HP +100.

**แนวคิด:** จิ้งจอกคาถา: พลังตรงต่ำกว่า Gargomon แต่กดศัตรูและฟื้นตัว; ✕ รบกวน Digimon support

**Lore:** A nine-tailed fox that lacks physical power but excels in spiritual energy and spells. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=kyubimon).

### Gargomon (324)

**Support:** If own Specialty is Nature, boost own ○ Attack Power +250 and lower opponent's ✕ Attack Power to 0.

**แนวคิด:** นักยิงแม่น: ○ แรงและปิดท่าก่อกวน ✕; แลกความคล่องด้าน DP ของสีเขียวด้วย DP 40

**Lore:** A cheerful, accurate hunter with twin arm guns, strong legs and occasional loss of control when angry. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=galgomon).

### Sunflowmon (325)

**Support:** If own Specialty is Nature, recover own HP +200 and add number of Nature Cards in own DP Slot x50 to own ○ Attack Power.

**แนวคิด:** ดอกไม้สะสมแสง: DP สีเขียวเป็นตัวแทนพลังที่เก็บ; ฟื้นตัวและเร่ง ○ ตามการเติบโต

**Lore:** Sunlight feeds its energy and attacks, while a thorn-covered stalk protects it. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=sunflowmon).

### Taomon (326)

**Support:** If own Specialty is Nature, void opponent's Digimon Support Effect, halve own Attack Power and recover own HP +200.

**แนวคิด:** ผู้วางยันต์: ล้างเฉพาะ Digimon support ระดับ 3 แลกกับพลังตนเองครึ่งหนึ่ง; ฟื้น HP เล็กน้อย

**Lore:** A quiet Taoist specializing in charms, curses, talismans and hidden implements. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=taomon).

### Rapidmon (327)

**Support:** If own Specialty is Nature and at least 1 Card is in own DP Slot, discard 1 Card from own DP Slot, boost own Attack Power +200 and attack first.

**แนวคิด:** นักล่าความเร็วสูง: support ชิงจังหวะพร้อมบุก แต่ใช้ DP จริง 1 ใบจึงกระทบการวิวัฒนาการ

**Lore:** A near-lightspeed cyborg with radar, precise movement and homing missiles. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=rapidmon).

### Lilamon (328)

**Support:** If own Specialty is Nature, lower own Attack Power -100. Digimon KO'd in this battle revives with 300 HP; the battle still counts as a loss.

**แนวคิด:** นางฟ้าคืนชีพ: รีไวฟ์ได้แต่เสียแต้มตามกฎเกม และใช้ไม่ได้กับ KO ที่ตัดสินแมตช์; พลังต่ำลงเป็นต้นทุน

**Lore:** A lilac pixie associated with death and rebirth, poison and entrancing pollen. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=lilamon).

## Darkness — กินข้อมูล / ดูด HP / ก่อกวน / ใช้ต้นทุนแลกพลัง

| Id | Card / Lv | HP | DP | +P | ○ / △ / ✕ | ✕ effect |
|---|---|---:|---:|---:|---|---|
| 329 | Keramon / R | 510 | 0 | 20 | 300 / 230 / 120 | Jamming |
| 330 | Monodramon / R | 620 | 0 | 20 | 360 / 260 / 150 | ○ to 0 |
| 331 | Dracmon / R | 470 | 0 | 20 | 330 / 220 / 160 | Eat-up HP |
| 332 | Kurisarimon / C | 1100 | 40 | 10 | 420 / 300 / 210 | △ to 0 |
| 333 | Strikedramon / C | 880 | 40 | 10 | 540 / 400 / 210 | Darkness Foe x3 |
| 334 | Sangloupmon / C | 930 | 30 | 10 | 490 / 360 / 220 | Eat-up HP |
| 335 | MetalTyrannomon / U | 1870 | 60 | 0 | 930 / 620 / 0 | ○ Counter |
| 336 | Cyberdramon / U | 1750 | 50 | 10 | 850 / 640 / 300 | Darkness Foe x3 |
| 337 | Matadormon / U | 1460 | 40 | 10 | 730 / 480 / 310 | 1st Attack |

### Keramon (329)

**Support:** If own Specialty is Darkness, discard 2 Cards from opponent's Online Deck and draw 1 Card.

**แนวคิด:** นักกินข้อมูล: ตัดเด็ค 2 แล้วจั่ว 1; HP ต่ำและพลังกลาง ป้องกันการเก่งทั้งบุกและ mill

**Lore:** Playfully consumes and destroys data, shooting a destructive beam while laughing. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=keramon).

### Monodramon (330)

**Support:** If own Specialty is Darkness and own HP are 400 or less, boost own Attack Power +250.

**แนวคิด:** มังกรไม่ยอมแพ้: support เร่งพลังเมื่อบาดเจ็บ; Crack Bite ในธีมการ์ดทำให้ท่า ○ ขัดข้อง

**Lore:** A persistent rough brawler; its bite fragments data and can cause malfunctions. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=monodramon).

### Dracmon (331)

**Support:** If own Specialty is Darkness, opponent uses △ and opponent's △ Attack Power is lowered by 100.

**แนวคิด:** แวมไพร์เจ้าเล่ห์: บังคับคู่ต่อสู้เล่น △ แล้วลดพลัง; ✕ ดูดเลือดชดเชย HP เริ่มต้นต่ำ

**Lore:** A reckless vampire prankster whose palm eyes can control minds. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=dracumon).

### Kurisarimon (332)

**Support:** If own Specialty is Darkness and at least 1 Card is in own DP Slot, discard 1 Card from own DP Slot, recover own HP +300 and discard 3 Cards from opponent's Online Deck.

**แนวคิด:** ดักแด้สะสมพลัง: HP สูงแต่ตีเบา; ใช้ DP ที่สะสมเพื่อซ่อมตัวและทำลายข้อมูลฝั่งตรงข้าม

**Lore:** An immobile tough chrysalis stores energy while tentacles destroy composition data. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=chrysalimon).

### Strikedramon (333)

**Support:** If opponent's Specialty is Darkness and own HP are more than 100, lose 100 HP and boost own Attack Power +300.

**แนวคิด:** นักล่าไวรัส: เป้าหมายในเกมคือสี Darkness แทนฝั่งศัตรู ไม่เท่ากับ Virus ทุกตัว; พลังแรงแบบมีต้นทุน

**Lore:** A commando dragon hunts Virus Digimon with relentless extermination instincts and heated armor. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=strikedramon).

### Sangloupmon (334)

**Support:** If own Specialty is Darkness, own attack gains Eat-up HP and opponent's ○ Attack Power is lowered by 100.

**แนวคิด:** หมาป่าดูดพลัง: ทุกท่าที่เลือกดูด HP ได้ในศึกนี้; เงาหลบแทนด้วยการลด ○ ไม่ใช่หลบแน่นอน

**Lore:** A noble bloodsucking wolf drains DigiCore information and can vanish into a foe’s shadow. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=sangloupmon).

### MetalTyrannomon (335)

**Support:** If own Specialty is Darkness, halve opponent's ○ Attack Power and boost own ○ Attack Power +150.

**แนวคิด:** ป้อมเคลื่อนที่: HP และ ○ สูง เกราะสวน ○; DP 60 และ +P 0 จำกัดการใช้เป็นเชื้อเพลิง

**Lore:** A heavily strengthened anti-ground cyborg whose armor repels attacks, with missile and laser arms. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=metaltyranomon).

### Cyberdramon (336)

**Support:** If opponent's Specialty is Darkness, void opponent's Digimon Support Effect and lower own Attack Power -100.

**แนวคิด:** ผู้ลบไวรัส: ล้าง Digimon support ของฝ่าย Darkness ระดับ 3 แลกพลัง 100; ไม่ล้าง Option support

**Lore:** An independent Virus hunter with resistant rubber armor and claws that eradicate configuration data. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=cyberdramon).

### Matadormon (337)

**Support:** If opponent's HP are more than own HP, own attack gains Eat-up HP and own △ Attack Power is boosted by 150.

**แนวคิด:** นักเต้นแวมไพร์: เล็งฝ่าย HP สูงกว่าเพื่อกินเลือด; △ ได้แรงเพิ่ม ส่วน ✕ ชิงจังหวะ

**Lore:** A dancing vampire martial artist seeks strong Digimon as prey and hides many rapiers in its clothing. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=matadrmon).

## Rare — เทคนิค / ตอบโต้ / ป้องกันด้วยแสง / ความยืดหยุ่น

| Id | Card / Lv | HP | DP | +P | ○ / △ / ✕ | ✕ effect |
|---|---|---:|---:|---:|---|---|
| 338 | Dracomon / R | 550 | 0 | 20 | 280 / 240 / 160 | Crash |
| 339 | Bearmon / R | 640 | 0 | 20 | 280 / 220 / 0 | ○ Counter |
| 340 | Kudamon / R | 610 | 0 | 20 | 250 / 200 / 150 | Darkness Foe x3 |
| 341 | Coredramon (Blue) / C | 960 | 40 | 10 | 480 / 350 / 190 | ○ to 0 |
| 342 | Grizzlymon / C | 990 | 40 | 10 | 460 / 330 / 0 | ○ Counter |
| 343 | Reppamon / C | 820 | 30 | 10 | 420 / 310 / 150 | 1st Attack |
| 344 | Wingdramon / U | 1720 | 50 | 10 | 810 / 650 / 300 | 1st Attack |
| 345 | GrapLeomon / U | 1810 | 50 | 10 | 830 / 620 / 0 | △ Counter |
| 346 | Chirinmon / U | 1980 | 50 | 20 | 750 / 570 / 310 | Darkness Foe x3 |

### Dracomon (338)

**Support:** If own Specialty is Rare and own HP are 300 or less, boost own Attack Power +200 and opponent's Attack Power +100.

**แนวคิด:** มังกรเกล็ดพิโรธ: ยิ่งเจ็บยิ่งแรงแต่เพิ่มพลังศัตรูด้วย; Crash มีความเสี่ยงตามกฎเกมเดิม

**Lore:** An ancient strong dragon child whose fury scale triggers indiscriminate rage. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=dracomon).

### Bearmon (339)

**Support:** If own Specialty is Rare, recover own HP +150 and boost own ○ Attack Power +100.

**แนวคิด:** หมีอึด: ฟื้น HP แล้วต่อยต่อ สวนหมัด ○; จ่ายพลัง ✕ เพื่อความสามารถสวน

**Lore:** A friendly, plucky bear with great stamina and destructive punches it must wrap its fists to withstand. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=bearmon).

### Kudamon (340)

**Support:** If own Specialty is Rare, recover own HP +100 and lower opponent's ○ Attack Power -100.

**แนวคิด:** ผู้คุ้มครองศักดิ์สิทธิ์: แสงรบกวน ○ และเยียวยา; พลังตรงต่ำ แต่ Holy Light ✕ ชนะ Darkness

**Lore:** A calm holy beast stores sacred power, shelters inside its cartridge and blinds foes with light. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=kudamon).

### Coredramon (Blue) (341)

**Support:** If own Specialty is Rare, boost own ○ Attack Power +250 and lower opponent's ○ Attack Power -100.

**แนวคิด:** มังกรเปิดจุดอ่อน: ลด ○ ศัตรูและเร่ง ○ ตนเอง; สีน้ำเงินของตัวไม่จำเป็นต้องเป็นการ์ด Ice

**Lore:** A swift pure-blooded blue dragon whose blue flames strip texture data and expose DigiCores. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=coredramon_b).

### Grizzlymon (342)

**Support:** If opponent uses ○, counterattack and attack second, and recover own HP +200.

**แนวคิด:** หมีรับแล้วสวน: พลังของ support มาจากการสวนตามกฎเกม ต้องทาย ○ ถูก; ถ้าผิดไม่ฟื้น HP ด้วย

**Lore:** An honest martial artist redirects enemy force, avoiding or deflecting blows despite its size. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=gryzmon).

### Reppamon (343)

**Support:** If own Specialty is Rare, boost own △ Attack Power +150 and lower opponent's △ Attack Power -150.

**แนวคิด:** หางมีเจตจำนง: รับและตัดทาง △ พร้อมเพิ่มแรง △; HP ต่ำแต่ DP 30 เข้าเกมไว

**Lore:** A nimble forest fighter whose independently moving blade tail covers surprise attacks. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=reppamon).

### Wingdramon (344)

**Support:** If own Specialty is Rare and own HP are more than 100, lose 100 HP, boost own ○ Attack Power +150 and attack first.

**แนวคิด:** จ้าวเวหา: ชิงก่อนและเร่ง ○ ด้วยการพุ่งเสีย HP; ไม่มีการหลบทุกท่าหรือ damage นอกกฎเกม

**Lore:** A largely airborne dragon exceeding Mach 20, creating damaging shockwaves as it moves. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=wingdramon).

### GrapLeomon (345)

**Support:** If own Specialty is Rare and at least 1 Card is in own DP Slot, discard 1 Card from own DP Slot, boost own Attack Power +300 and draw 1 Card.

**แนวคิด:** นักสู้กังหัน: ใช้ DP เป็นแรงขับ เร่งทั้งชุดและเติมมือ; ✕ สวน △ แทนท่าตีธรรมดา

**Lore:** A fighting-game-trained martial artist powers limb turbines with focused DigiCore fighting spirit. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=grappuleomon).

### Chirinmon (346)

**Support:** If own Specialty is Rare and own HP are less than opponent's HP, recover own HP +400 and lower opponent's Attack Power -200.

**แนวคิด:** ผู้พิทักษ์เมตตา: stat สมดุลและ support กู้ฝ่ายเสียเปรียบ; ไม่แจก heal 400 แบบไร้เงื่อนไข

**Lore:** An ancient compassionate holy beast, powerful for an Ultimate, opposing cruelty and guiding foes toward righteousness. [Official Reference Book](https://digimon.net/reference_en/detail.php?directory_name=tyilinmon).

## Encoding และที่มาของกลไก

ใช้เฉพาะ engine.js ที่มีอยู่: getVar (0x801e7dd4), exec (0x801e81dc),
runEffect (0x801e9c1c), runXfx (0x801e9700), HP cap/การหารตัดลงหลักสิบ (0x801e9abc).
DP สี Nature ใช้ตัวแปรโปรเจกต์ 0x42 ซึ่งมีอยู่เดิมและใช้แนวทาง BlackWarGreymon
ไม่ใช่ตัวแปรบนดิสก์; DP count หมายถึงจำนวนใบ ไม่ใช่ผลรวม +P.
ข้อมูลจริงอยู่ใน tools/custom_cards.json; docs ไม่เป็น runtime source อีกชุด

## Validation

- selftest 31 checks รวม 113 support scenarios: ครบทุกใบ, เงื่อนไขผ่าน/ไม่ผ่าน,
  ทรัพยากรไม่พอ, การนับเฉพาะ Nature DP, รีไวฟ์/เสียแต้ม/KO ตัดสิน และ void เฉพาะ Digimon
- decktest 11, sim ปกติ 200 แมตช์ไม่ค้าง, fxtest ทั้ง 31 scripts,
  battletest 237 Digimon / 711 ท่าในแต่ละรูปแบบการแสดงผลทั้ง 3 แบบ ผ่าน
- TS soak 750 แมตช์: 300 ชนต้นแบบ, 300 ชนชุดใหม่กันเอง, 150 เด็คสามสี;
  ไม่ค้าง, จำนวนการ์ด 30 ใบต่อฝ่ายคงอยู่, support ทั้ง 45 ใบมีการเปิดใช้จริง
  ค่าเฉลี่ย 10.7 เทิร์น, สูงสุด 34 เทิร์น; AI มีการสุ่ม ผลชนะอาจเปลี่ยนเมื่อรันใหม่
- Browser: อ่านค่า/ท่า/✕/support ทั้ง 45 ใบจาก editor จริงใน Legacy และ New รวม 90 previews
  และเทียบกับข้อมูล runtime/ตารางนี้ รายการยาวเลื่อนได้ในแถบรายละเอียด ไม่ถูกตัดข้อมูล
- เล่นการแสดงผล support จริงของ Coronamon (เสีย HP 100), Keramon (mill 2/draw 1),
  Taomon (void Digimon support/half attack/heal 200) ในแมตช์สองผู้เล่น โดยจัดมือ,
  DP และฝั่งตรงข้ามเอง; คืนค่าสถานะ active เต็มก่อนศึก ไม่ใช่การเล่นเด็คปกติจนถึงสถานการณ์นั้น
  ทุกใบตรวจเชิงพฤติกรรมด้วย node; ไม่ได้เล่นภาพ support ทุกใบด้วยมือ
- การ์ดบนดิสก์ 301 ใบ, BlackWarGreymon และเด็คจริงทั้ง 160 เด็คเหมือนก่อน TS-106 ทุกค่า
  รูปภาพ, model, animation/effect assets เหมือนก่อน ตรวจ check_paths หลัง staging ผ่าน
- แก้ชื่อที่อักษรพิเศษเสีย 3 รายการ: CoronaｰKnuckles, Giga DestroyerⅡ, Great StrikeⅡ
  ตาม Reference Book และตรวจใน browser ทั้งสองรูปแบบภาพ
- หลักฐานในเครื่อง: extracted/newart/ts-phase1-browser/ts106-*;
  log soak: extracted/time_stranger_references/ts106-design-test.log (ไม่ใส่ใน git)
- งานนี้เป็นหนึ่ง request commit ของ TS-106 รวมและ push เข้า time-stranger;
  ยังมี Phase 2/3 และการเล่นเพื่อปรับบาลานซ์ตามแผนงานเดิม
