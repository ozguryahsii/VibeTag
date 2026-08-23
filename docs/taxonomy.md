# Değerlendirme taksonomisi ve rozet tablosu

Bu dosya elle yazılmadı — `npm run taxonomy --silent > docs/taxonomy.md`
komutu uygulamanın çalıştığı modüllerden üretir. Tabloyu değiştirmek için
`src/lib/taxonomy.ts`, `src/lib/badges.ts` ve `src/lib/verification.ts`
dosyaları düzenlenir, sonra bu komut yeniden çalıştırılır.

## Kurallar

| | |
|---|---|
| Kriter puanı ölçeği | 1..5 (1 = en düşük, 5 = en yüksek) |
| Bir değerlendirmede etiket | en az 1, en fazla 5 |
| Değerlendirme güncelleme aralığı | 30 gün |
| Tanışıklık kategorisi | 4 çevre, 16 seçenek |
| Kriter (soru) havuzu | 28 |
| Etiket havuzu | 18 |
| Rozet | 11 aile × 3 kademe = 33 |

## Cevaplar nereye işliyor?

| Girdi | Etkilediği yer |
|---|---|
| Tanışıklık seçimi | Hangi kriterlerin sorulacağını ve hangi etiketlerin verilebileceğini belirler (bağlam kilidi). Profildeki «Nereden tanınıyor?» dağılımını ve çevre bazlı puanı besler. |
| Kriter puanları (1–5) | 0–100'e çevrilir. Ağırlıklı ortalaması Vibe Score'u oluşturur; her kriter ayrıca kendi «Güçlü yönler» çubuğunu ve gelişim alanlarını besler. Rozetlerin çoğu doğrudan bu kriter puanlarına bakar. |
| Etiketler | Sayılır. Profildeki ve Vibe Card'daki en çok oy alan 5 etiketi belirler; «Good Energy» rozeti Positive Energy etiketinin sayısını da kabul eder. |
| Not (yorum) | Puana etki etmez. Profilde anonim not olarak görünür (§9 — hiçbir zaman kime ait olduğu yazılmaz). Gold üyeler yalnızca *kendilerine* yapılan değerlendirmelerde yazanı görebilir; koruma altına alınmış bir oy Gold'a da açılmaz. |

### Vibe Score nasıl hesaplanıyor?

```
her kriter puanı (1..5)  →  (puan - 1) / 4 × 100      # 0..100
ham skor  = ağırlıklı ortalama (ağırlık = değerlendirmenin güven ağırlığı)
Vibe Score = (ham skor × toplam ağırlık + 78 × 4) / (toplam ağırlık + 4)
```

Baştaki `78 × 4`, az veriyle uç sonuç çıkmasını engelleyen nötr başlangıçtır:
üç kişinin oyladığı bir profil 100 göstermez. Sahtecilik korumasına takılan
değerlendirmeler `ağırlık = 0` alır — silinmez ama skora hiç girmez.
Kriter puanlarında da aynı mantık 3 birim güçle uygulanır, o yüzden tek bir
beşlik bir kriteri 100 yapmaz.

## Tanışıklık kategorileri

### 💼 Profesyonel — `PROFESSIONAL`

İş, proje veya kariyer ilişkisi. Bu çevrede verilebilen etiketler (16):

`Positive Energy` · `Reliable` · `Kind` · `Problem Solver` · `Leader` · `Focused` · `Creative` · `Supportive` · `Punctual` · `Trustworthy` · `Good Listener` · `Communicator` · `Team Player` · `Inspiring` · `Professional` · `Calm`

#### 🏢 Aynı şirkette çalıştık — `sameCompany`

Sorulan kriterler (6):

| # | Kriter | Soru | EN |
|---|---|---|---|
| 1 | Güvenilirlik | Sözünü tutar mı? | Reliability |
| 2 | İletişim | Kendini net ifade eder, seni dinler mi? | Communication |
| 3 | Takım çalışması | Ekiple uyumlu çalışır mı? | Teamwork |
| 4 | Profesyonellik | İşini ciddiye alır mı? | Professionalism |
| 5 | Çalışkanlık | Emek verir mi? | Diligence |
| 6 | Çözüm Odaklı | Problem çözümlerinde aktif rol alıyor mu? *(bu çevreye özel)* | Problem Solving |

#### 🧭 Yöneticimdi — `wasMyManager`

Sorulan kriterler (9):

| # | Kriter | Soru | EN |
|---|---|---|---|
| 1 | Liderlik | Yön gösterir mi? | Leadership |
| 2 | İletişim | Kendini net ifade eder, seni dinler mi? | Communication |
| 3 | Güvenilirlik | Verdiği sözleri tutar mı? *(bu çevreye özel)* | Reliability |
| 4 | Empati | Seni anlar mı? | Empathy |
| 5 | Profesyonellik | İşini ciddiye alır mı? | Professionalism |
| 6 | Çözüm Odaklı | Çözüm üretir mi? | Problem Solving |
| 7 | Adalet | Ekibi içindeki değerlendirmelerde adil mi? | Justice |
| 8 | Eşitlik | Farklı kişilerle yaşanan aynı olaylarda eşit tepki verir mi? | Equality |
| 9 | İşinde Uzman | İşini doğru yapmak için gerekli bilgiye sahip mi? | Expertise |

#### 📋 Çalışanımdı — `wasMyEmployee`

Sorulan kriterler (8):

| # | Kriter | Soru | EN |
|---|---|---|---|
| 1 | Sorumluluk | Sorumluluk alır mı? | Responsibility |
| 2 | Çalışkanlık | Emek verir mi? | Diligence |
| 3 | Güvenilirlik | Sözünü tutar mı? | Reliability |
| 4 | Çözüm Odaklı | Çözüm üretir mi? | Problem Solving |
| 5 | Dakiklik | Zamanlamaya sadık mı? *(bu çevreye özel)* | Punctuality |
| 6 | Takım çalışması | Ekiple uyumlu çalışır mı? | Teamwork |
| 7 | İşinde Uzman | İşini doğru yapmak için gerekli bilgiye sahip mi? | Expertise |
| 8 | Kurallara Uyum | Şirketin belirlediği kurallara uyar mı? | Compliance |

#### 🧑‍💻 Aynı projede çalıştık — `sameProject`

Sorulan kriterler (7):

| # | Kriter | Soru | EN |
|---|---|---|---|
| 1 | Güvenilirlik | Sözünü tutar mı? | Reliability |
| 2 | Sorumluluk | Sorumluluk alır mı? | Responsibility |
| 3 | Takım çalışması | Ekiple uyumlu çalışır mı? | Teamwork |
| 4 | Çözüm Odaklı | Çözüm üretir mi? | Problem Solving |
| 5 | Çalışkanlık | Emek verir mi? | Diligence |
| 6 | İletişim | Kendini net ifade eder, seni dinler mi? | Communication |
| 7 | İşinde Uzman | İşini doğru yapmak için gerekli bilgiye sahip mi? | Expertise |

#### 🤝 Müşterimdi — `wasMyClient`

Sorulan kriterler (6):

| # | Kriter | Soru | EN |
|---|---|---|---|
| 1 | İletişim | Kendini net ifade eder, seni dinler mi? | Communication |
| 2 | Saygı | Sınırlara saygılı mı? | Respect |
| 3 | Güvenilirlik | Sözünü tutar mı? | Reliability |
| 4 | Dakiklik | Zamanına sadık mı? | Punctuality |
| 5 | Dürüst ticaret | Fiyat ve şartlarda adil mi? | Fairness |
| 6 | İşinde Uzman | İşini doğru yapmak için gerekli bilgiye sahip mi? | Expertise |

### 🫂 Sosyal — `SOCIAL`

Arkadaşlık, aile ve sosyal çevre. Bu çevrede verilebilen etiketler (12):

`Positive Energy` · `Reliable` · `Kind` · `Creative` · `Supportive` · `Fun` · `Trustworthy` · `Good Listener` · `Communicator` · `Inspiring` · `Generous` · `Calm`

#### 💛 Yakın arkadaşım — `closeFriend`

Sorulan kriterler (7):

| # | Kriter | Soru | EN |
|---|---|---|---|
| 1 | Dürüstlük | Doğruyu söyler mi? | Honesty |
| 2 | Empati | Seni anlar mı? | Empathy |
| 3 | Güvenilirlik | Sözünü tutar mı? | Reliability |
| 4 | Destekleyicilik | Zor anında yanında mı? | Supportiveness |
| 5 | Eğlenceli | Birlikte vakit geçirmek keyifli mi? | Fun |
| 6 | Pozitif enerji | Ortama enerji katar mı? | Positive Energy |
| 7 | Sadık | İlişkilerine sadık mıdır? | Loyalty |

#### 🙂 Arkadaşım — `friend`

Sorulan kriterler (6):

| # | Kriter | Soru | EN |
|---|---|---|---|
| 1 | Güvenilirlik | Sözünü tutar mı? | Reliability |
| 2 | Kibarlık | Nazik ve saygılı mı? | Kindness |
| 3 | Eğlenceli | Birlikte vakit geçirmek keyifli mi? | Fun |
| 4 | İletişim | Kendini net ifade eder, seni dinler mi? | Communication |
| 5 | Pozitif enerji | Ortama enerji katar mı? | Positive Energy |
| 6 | Dürüstlük | Doğruyu söyler mi? | Honesty |

#### 🎉 Sosyal çevreden tanıyorum — `socialCircle`

Sorulan kriterler (5):

| # | Kriter | Soru | EN |
|---|---|---|---|
| 1 | Kibarlık | Nazik ve saygılı mı? | Kindness |
| 2 | Saygı | Sınırlara saygılı mı? | Respect |
| 3 | Pozitif enerji | Ortama enerji katar mı? | Positive Energy |
| 4 | İletişim | Kendini net ifade eder, seni dinler mi? | Communication |
| 5 | Mesafeye Saygı | Yeni ortamlarda mesafesini korumayı bilir mi? | Respects Boundaries |

#### 🏡 Aile çevresinden tanıyorum — `familyCircle`

Sorulan kriterler (7):

| # | Kriter | Soru | EN |
|---|---|---|---|
| 1 | Kibarlık | Nazik ve saygılı mı? | Kindness |
| 2 | Saygı | Sınırlara saygılı mı? | Respect |
| 3 | Destekleyicilik | Zor anında yanında mı? | Supportiveness |
| 4 | Güvenilirlik | Sözünü tutar mı? | Reliability |
| 5 | Empati | Seni anlar mı? | Empathy |
| 6 | Eğlenceli | Birlikte vakit geçirmek keyifli mi? | Fun |
| 7 | Dürüstlük | Doğruyu söyler mi? | Honesty |

### 🛍️ Hizmet / Ticaret — `COMMERCE`

Alışveriş, hizmet ve ticari ilişki. Bu çevrede verilebilen etiketler (10):

`Positive Energy` · `Reliable` · `Kind` · `Problem Solver` · `Punctual` · `Trustworthy` · `Communicator` · `Professional` · `Generous` · `Calm`

#### 🏪 Satıcı olarak tanıyorum — `knowAsSeller`

Sorulan kriterler (5):

| # | Kriter | Soru | EN |
|---|---|---|---|
| 1 | Dürüst ticaret | Fiyat ve şartlarda adil mi? | Fairness |
| 2 | Kibarlık | Nazik ve saygılı mı? | Kindness |
| 3 | İletişim | Kendini net ifade eder, seni dinler mi? | Communication |
| 4 | Güvenilirlik | Sözünü tutar mı? | Reliability |
| 5 | İş kalitesi | Ortaya çıkan iş iyi mi? | Work Quality |

#### 🧾 Müşteri olarak tanıyorum — `knowAsCustomer`

Sorulan kriterler (5):

| # | Kriter | Soru | EN |
|---|---|---|---|
| 1 | Saygı | Sınırlara saygılı mı? | Respect |
| 2 | İletişim | Kendini net ifade eder, seni dinler mi? | Communication |
| 3 | Dakiklik | Zamanına sadık mı? | Punctuality |
| 4 | Dürüst ticaret | Fiyat ve şartlarda adil mi? | Fairness |
| 5 | Kibarlık | Nazik ve saygılı mı? | Kindness |

#### 🛎️ Hizmet aldım — `receivedService`

Sorulan kriterler (6):

| # | Kriter | Soru | EN |
|---|---|---|---|
| 1 | Kibarlık | Nazik ve saygılı mı? | Kindness |
| 2 | İletişim | Kendini net ifade eder, seni dinler mi? | Communication |
| 3 | Yardımseverlik | İhtiyaç anında yardım eder mi? | Helpfulness |
| 4 | Profesyonellik | İşini ciddiye alır mı? | Professionalism |
| 5 | İş kalitesi | Ortaya çıkan iş iyi mi? | Work Quality |
| 6 | Dakiklik | Zamanına sadık mı? | Punctuality |

#### 🔧 Hizmet verdim — `providedService`

Sorulan kriterler (5):

| # | Kriter | Soru | EN |
|---|---|---|---|
| 1 | Saygı | Sınırlara saygılı mı? | Respect |
| 2 | İletişim | Kendini net ifade eder, seni dinler mi? | Communication |
| 3 | Dürüst ticaret | Fiyat ve şartlarda adil mi? | Fairness |
| 4 | Dakiklik | Zamanına sadık mı? | Punctuality |
| 5 | Kibarlık | Nazik ve saygılı mı? | Kindness |

### 🌐 Diğer — `OTHER`

Online ve topluluk tanışıklığı. Bu çevrede verilebilen etiketler (12):

`Positive Energy` · `Reliable` · `Kind` · `Problem Solver` · `Focused` · `Creative` · `Supportive` · `Fun` · `Good Listener` · `Communicator` · `Inspiring` · `Calm`

#### 💻 Online tanışıyoruz — `online`

Sorulan kriterler (5):

| # | Kriter | Soru | EN |
|---|---|---|---|
| 1 | İletişim | Kendini net ifade eder, seni dinler mi? | Communication |
| 2 | Kibarlık | Nazik ve saygılı mı? | Kindness |
| 3 | Yardımseverlik | İhtiyaç anında yardım eder mi? | Helpfulness |
| 4 | Pozitif enerji | Ortama enerji katar mı? | Positive Energy |
| 5 | Dış Görünüş | Dış görünüşüne özen gösteriyor mu? | Appearance |

#### 🌍 Sosyal medya üzerinden takip ediyorum — `community`

Sorulan kriterler (7):

| # | Kriter | Soru | EN |
|---|---|---|---|
| 1 | Yardımseverlik | İnsanlara yardım eder mi? *(bu çevreye özel)* | Helpfulness |
| 2 | İletişim | Kendini net ifade eder, seni dinler mi? | Communication |
| 3 | Kibarlık | Nazik ve saygılı mı? | Kindness |
| 4 | Eğlenceli | İçerikleri eğlenceli mi? *(bu çevreye özel)* | Fun |
| 5 | Yaratıcılık | Farklı fikirler üretir mi? | Creativity |
| 6 | Dış Görünüş | Dış görünüşüne özen gösteriyor mu? | Appearance |
| 7 | Doğal Olma | Sosyal medya içerikleri kendini yansıtıyor mu? | Authenticity |

#### ✳️ Diğer — `other`

Sorulan kriterler (4):

| # | Kriter | Soru | EN |
|---|---|---|---|
| 1 | Kibarlık | Nazik ve saygılı mı? | Kindness |
| 2 | İletişim | Kendini net ifade eder, seni dinler mi? | Communication |
| 3 | Saygı | Sınırlara saygılı mı? | Respect |
| 4 | Pozitif enerji | Ortama enerji katar mı? | Positive Energy |

## Kriter havuzu

Bir kriter kaç tanışıklıkta soruluyorsa o kadar veri toplar. Yalnızca tek
bir tanışıklıkta sorulan kriterler, o kritere bağlı rozeti de fiilen o
tanışıklığın arkasına kilitler — aşağıdaki son sütun bunun için var.

| Kriter | Soru | EN | Kaç tanışıklıkta | Hangileri |
|---|---|---|---|---|
| 💬 İletişim | Kendini net ifade eder, seni dinler mi? | Communication | 13 | Aynı şirkette çalıştık, Yöneticimdi, Aynı projede çalıştık, Müşterimdi, Arkadaşım, Sosyal çevreden tanıyorum, Satıcı olarak tanıyorum, Müşteri olarak tanıyorum, Hizmet aldım, Hizmet verdim, Online tanışıyoruz, Sosyal medya üzerinden takip ediyorum, Diğer |
| ❤️ Kibarlık | Nazik ve saygılı mı? | Kindness | 10 | Arkadaşım, Sosyal çevreden tanıyorum, Aile çevresinden tanıyorum, Satıcı olarak tanıyorum, Müşteri olarak tanıyorum, Hizmet aldım, Hizmet verdim, Online tanışıyoruz, Sosyal medya üzerinden takip ediyorum, Diğer |
| 🤝 Güvenilirlik | Sözünü tutar mı? | Reliability | 9 | Aynı şirkette çalıştık, Yöneticimdi, Çalışanımdı, Aynı projede çalıştık, Müşterimdi, Yakın arkadaşım, Arkadaşım, Aile çevresinden tanıyorum, Satıcı olarak tanıyorum |
| 🙏 Saygı | Sınırlara saygılı mı? | Respect | 6 | Müşterimdi, Sosyal çevreden tanıyorum, Aile çevresinden tanıyorum, Müşteri olarak tanıyorum, Hizmet verdim, Diğer |
| ⏱️ Dakiklik | Zamanına sadık mı? | Punctuality | 5 | Çalışanımdı, Müşterimdi, Müşteri olarak tanıyorum, Hizmet aldım, Hizmet verdim |
| 🔥 Pozitif enerji | Ortama enerji katar mı? | Positive Energy | 5 | Yakın arkadaşım, Arkadaşım, Sosyal çevreden tanıyorum, Online tanışıyoruz, Diğer |
| 💡 Çözüm Odaklı | Çözüm üretir mi? | Problem Solving | 4 | Aynı şirkette çalıştık, Yöneticimdi, Çalışanımdı, Aynı projede çalıştık |
| 😄 Eğlenceli | Birlikte vakit geçirmek keyifli mi? | Fun | 4 | Yakın arkadaşım, Arkadaşım, Aile çevresinden tanıyorum, Sosyal medya üzerinden takip ediyorum |
| ⚖️ Dürüst ticaret | Fiyat ve şartlarda adil mi? | Fairness | 4 | Müşterimdi, Satıcı olarak tanıyorum, Müşteri olarak tanıyorum, Hizmet verdim |
| 🎓 İşinde Uzman | İşini doğru yapmak için gerekli bilgiye sahip mi? | Expertise | 4 | Yöneticimdi, Çalışanımdı, Aynı projede çalıştık, Müşterimdi |
| 🙌 Yardımseverlik | İhtiyaç anında yardım eder mi? | Helpfulness | 3 | Hizmet aldım, Online tanışıyoruz, Sosyal medya üzerinden takip ediyorum |
| 🏆 Profesyonellik | İşini ciddiye alır mı? | Professionalism | 3 | Aynı şirkette çalıştık, Yöneticimdi, Hizmet aldım |
| 🧩 Takım çalışması | Ekiple uyumlu çalışır mı? | Teamwork | 3 | Aynı şirkette çalıştık, Çalışanımdı, Aynı projede çalıştık |
| ⚡ Çalışkanlık | Emek verir mi? | Diligence | 3 | Aynı şirkette çalıştık, Çalışanımdı, Aynı projede çalıştık |
| 🛡️ Dürüstlük | Doğruyu söyler mi? | Honesty | 3 | Yakın arkadaşım, Arkadaşım, Aile çevresinden tanıyorum |
| 🫶 Empati | Seni anlar mı? | Empathy | 3 | Yöneticimdi, Yakın arkadaşım, Aile çevresinden tanıyorum |
| 🎯 Sorumluluk | Sorumluluk alır mı? | Responsibility | 2 | Çalışanımdı, Aynı projede çalıştık |
| 🌱 Destekleyicilik | Zor anında yanında mı? | Supportiveness | 2 | Yakın arkadaşım, Aile çevresinden tanıyorum |
| ✨ İş kalitesi | Ortaya çıkan iş iyi mi? | Work Quality | 2 | Satıcı olarak tanıyorum, Hizmet aldım |
| 🪞 Dış Görünüş | Dış görünüşüne özen gösteriyor mu? | Appearance | 2 | Online tanışıyoruz, Sosyal medya üzerinden takip ediyorum |
| 🚀 Liderlik | Yön gösterir mi? | Leadership | 1 | Yöneticimdi |
| 🌟 Yaratıcılık | Farklı fikirler üretir mi? | Creativity | 1 | Sosyal medya üzerinden takip ediyorum |
| 🏛️ Adalet | Ekibi içindeki değerlendirmelerde adil mi? | Justice | 1 | Yöneticimdi |
| 🤲 Eşitlik | Farklı kişilerle yaşanan aynı olaylarda eşit tepki verir mi? | Equality | 1 | Yöneticimdi |
| 📏 Kurallara Uyum | Şirketin belirlediği kurallara uyar mı? | Compliance | 1 | Çalışanımdı |
| 💖 Sadık | İlişkilerine sadık mıdır? | Loyalty | 1 | Yakın arkadaşım |
| 🚪 Mesafeye Saygı | Yeni ortamlarda mesafesini korumayı bilir mi? | Respects Boundaries | 1 | Sosyal çevreden tanıyorum |
| 🍃 Doğal Olma | Sosyal medya içerikleri kendini yansıtıyor mu? | Authenticity | 1 | Sosyal medya üzerinden takip ediyorum |

## Etiket havuzu

| Etiket (EN) | TR | Verilebildiği çevreler |
|---|---|---|
| 🔥 Positive Energy | Pozitif Enerji | Profesyonel, Sosyal, Hizmet / Ticaret, Diğer |
| 🤝 Reliable | Güvenilir | Profesyonel, Sosyal, Hizmet / Ticaret, Diğer |
| ❤️ Kind | Kibar | Profesyonel, Sosyal, Hizmet / Ticaret, Diğer |
| 💡 Problem Solver | Çözüm Odaklı | Profesyonel, Hizmet / Ticaret, Diğer |
| 🚀 Leader | Lider | Profesyonel |
| 🎯 Focused | Odaklı | Profesyonel, Diğer |
| 🌟 Creative | Yaratıcı | Profesyonel, Sosyal, Diğer |
| 🫶 Supportive | Destekleyici | Profesyonel, Sosyal, Diğer |
| 😄 Fun | Eğlenceli | Sosyal, Diğer |
| ⏱️ Punctual | Dakik | Profesyonel, Hizmet / Ticaret |
| 🛡️ Trustworthy | Güven Veren | Profesyonel, Sosyal, Hizmet / Ticaret |
| 🎧 Good Listener | İyi Dinleyici | Sosyal, Profesyonel, Diğer |
| 💬 Communicator | İyi İletişimci | Profesyonel, Hizmet / Ticaret, Diğer, Sosyal |
| 🧩 Team Player | Takım Oyuncusu | Profesyonel |
| ✨ Inspiring | İlham Veren | Profesyonel, Sosyal, Diğer |
| 🏆 Professional | Profesyonel | Profesyonel, Hizmet / Ticaret |
| 🎁 Generous | Cömert | Sosyal, Hizmet / Ticaret |
| 🌊 Calm | Sakin | Profesyonel, Sosyal, Hizmet / Ticaret, Diğer |

## Rozetler

On aile, her birinin bronz / gümüş / altın kademesi var. Kademeler ayrı
ayrı kazanılır ve kaybedilmez: altına ulaşan üçünü birden taşır. Bir
ailenin şartlarında birden çok koşul varsa **hepsi** sağlanmalıdır —
«veya» yazan tek aile Good Energy'dir.

| Rozet | Anahtar | Koşul(lar) | Bronz | Gümüş | Altın |
|---|---|---|---|---|---|
| **Güven Veren** | `trustedPerson` | Güvenilirlik puanı **ve** Toplam değerlendirme sayısı | 75 / 3 | 85 / 8 | 92 / 15 |
| **İyi Enerji** | `goodEnergy` | Pozitif enerji puanı **veya** «Positive Energy» etiketini kaç kişinin verdiği | 75 / 3 | 85 / 8 | 92 / 15 |
| **Takım Oyuncusu** | `teamPlayer` | Takım çalışması puanı **ve** Profesyonel çevreden gelen değerlendirme sayısı | 72 / 2 | 84 / 5 | 91 / 10 |
| **Topluluk Favorisi** | `communityFavorite` | Toplam değerlendirme sayısı **ve** Vibe Score | 10 / 80 | 25 / 86 | 50 / 91 |
| **İyi Kalp** | `kindHeart` | Kibarlık puanı | 78 | 87 | 94 |
| **Çok Sosyal** | `manyWorlds` | Kaç farklı çevreden değerlendirme aldığı (4 üzerinden) | 2 | 3 | 4 |
| **Sözü Dürüst** | `straightTalker` | Dürüstlük puanı | 78 | 87 | 94 |
| **Çözüm Bulan** | `problemSolver` | Problem çözme puanı | 75 | 85 | 92 |
| **İyi Dinleyen** | `greatListener` | Empati puanı | 78 | 87 | 94 |
| **Çevresi Geniş** | `wellKnown` | Toplam değerlendirme sayısı | 5 | 20 | 50 |
| **Özgün Fikir** | `originalMind` | Yaratıcılık puanı | 78 | 87 | 94 |

Eşik değerleri koşulların yazıldığı sırayla okunur: `75 / 3` = ilk koşul 75,
ikinci koşul 3. Kriter puanları 0–100 ölçeğinde, sayımlar adet olarak.

## Gözden geçirirken dikkat çekenler

Aşağıdakiler kod okunarak değil, tablodan hesaplanarak çıkarıldı — yeni
kategori, kriter veya rozet eklerken bakılacak boşluklar.

**20 kriterin bağlı olduğu hiçbir rozet yok.** Bu kriterler
Vibe Score'a ve «Güçlü yönler» çubuklarına girer, ama kimseye kazanılacak
bir şey vaat etmez:

İletişim (`communication`), Yardımseverlik (`helpfulness`), Profesyonellik (`professionalism`), Sorumluluk (`responsibility`), Çalışkanlık (`diligence`), Liderlik (`leadership`), Dakiklik (`punctuality`), Destekleyicilik (`supportiveness`), Eğlenceli (`funToBeAround`), İş kalitesi (`workQuality`), Dürüst ticaret (`fairness`), Saygı (`respect`), İşinde Uzman (`expertise`), Adalet (`justice`), Eşitlik (`equality`), Kurallara Uyum (`compliance`), Sadık (`loyalty`), Mesafeye Saygı (`boundaries`), Dış Görünüş (`appearance`), Doğal Olma (`authenticity`).

**12 kriter en fazla iki tanışıklıktan sorulabiliyor.** Bir kritere
bağlı rozet varsa, o rozet fiilen o tanışıklığın arkasında kilitlidir:

| Kriter | Sorulduğu tanışıklık(lar) | Bağlı rozet |
|---|---|---|
| Sorumluluk | Çalışanımdı, Aynı projede çalıştık | — (yok) |
| Liderlik | Yöneticimdi | — (yok) |
| Destekleyicilik | Yakın arkadaşım, Aile çevresinden tanıyorum | — (yok) |
| Yaratıcılık | Sosyal medya üzerinden takip ediyorum | **Özgün Fikir** |
| İş kalitesi | Satıcı olarak tanıyorum, Hizmet aldım | — (yok) |
| Adalet | Yöneticimdi | — (yok) |
| Eşitlik | Yöneticimdi | — (yok) |
| Kurallara Uyum | Çalışanımdı | — (yok) |
| Sadık | Yakın arkadaşım | — (yok) |
| Mesafeye Saygı | Sosyal çevreden tanıyorum | — (yok) |
| Dış Görünüş | Online tanışıyoruz, Sosyal medya üzerinden takip ediyorum | — (yok) |
| Doğal Olma | Sosyal medya üzerinden takip ediyorum | — (yok) |

**Çevre başına kapalı etiketler.** Bir çevreden hiç verilemeyen etiketler,
o çevreden gelen değerlendirmelerle asla ilk 5'e giremez:

| Çevre | Kapalı etiketler |
|---|---|
| 💼 Profesyonel | Fun, Generous |
| 🫂 Sosyal | Problem Solver, Leader, Focused, Punctual, Team Player, Professional |
| 🛍️ Hizmet / Ticaret | Leader, Focused, Creative, Supportive, Fun, Good Listener, Team Player, Inspiring |
| 🌐 Diğer | Leader, Punctual, Trustworthy, Team Player, Professional, Generous |

## Doğrulama rozetleri

Bunlar kazanılan değil, ispatlanan rozetlerdir; rozet merdiveninin dışında
durur ve profil kartının sol üst köşesinde görünür.

| Doğrulama | Anahtar | Simge | Açıklama | Durum |
|---|---|---|---|---|
| E-posta doğrulandı | `email` | `envelope` | Kayıt olduğun adresi onayladın | Aktif |
| Telefon doğrulandı | `phone` | `message` | Telefonuna gönderilen kodla onaylandı | Sağlayıcı bekliyor (yakında) |
| Kimlik doğrulandı | `identity` | `fingerprint` | Kimlik kartı veya pasaport ile onaylandı | Sağlayıcı bekliyor (yakında) |

