const express = require('express');
const { Client } = require('pg');
const path = require('path');

const app = express();
const port = 3000;

const veritabaniBilgileri = {
    user: 'postgres',
    host: 'localhost',
    database: 'VYTS_proje',
    password: 'efe05508',
    port: 5432,
};

const istemci = new Client(veritabaniBilgileri);

let allData = {}; // Tüm verileri tutacağımız nesne
app.use(express.json()); // JSON formatındaki istek gövdelerini işler

// Veritabanına bağlan ve güncellenmiş sorguyu çalıştır
async function veriYukle() {
    try {
        await istemci.connect();
        console.log("Veritabanına bağlanıldı.");

        // Yeni sorgu
        const mulklerSonuc = await istemci.query(`
         SELECT
    "Mulkler"."mulkTipiNo",
    "Mulkler"."mulkNo",
    "Kira"."kiraNo",
    "Mulkler"."mulkAdi",   
    "MulkTipleri"."mulkTipiAdi" AS "Mülk_Tipi",
    birlestir_isim_soyisim("Kiracilar"."isim", "Kiracilar"."soyisim") AS "AdSoyad",
    "Sehirler"."sehirIsmi" AS "Sehir",
    birlestir_ucret_para_birimi("Kira"."ucret", "ParaBirimi"."birimKisaltma") AS "ucret",
    kalan_ay_hesapla("Kira"."bitisTarihi") AS "Kalan_Ay"
FROM "sema1"."Mulkler"
JOIN "sema1"."MulkTipleri"  ON "MulkTipleri"."mulkTipiNo" = "Mulkler"."mulkTipiNo" 
LEFT JOIN "sema1"."Kira" ON "Kira"."mulkNo" = "Mulkler"."mulkNo"
LEFT JOIN "sema1"."Kiracilar" ON "Kiracilar"."kiraciNo" = "Kira"."kiraciNo"
LEFT JOIN "sema1"."Sehirler" ON "Sehirler"."sehirNo" = "Mulkler"."sehirNo"
LEFT JOIN "sema1"."ParaBirimi" ON "ParaBirimi"."paraBirimiNo" = "Kira"."paraBirimiNo"
        `);
        allData.mulkler = mulklerSonuc.rows;

        console.log("Mülkler yüklendi.");
    } catch (error) {
        console.error("Veri yükleme hatası:", error);
    }
}

veriYukle();


app.get('/api/mulkler', async (req, res) => {
    try {
        const query = `
       SELECT
    "Mulkler"."mulkTipiNo",
    "Mulkler"."mulkNo",
    "Mulkler"."mulkAdi",
    "Kira"."kiraNo",
    "MulkTipleri"."mulkTipiAdi" AS "Mülk_Tipi",
    birlestir_isim_soyisim("Kiracilar"."isim", "Kiracilar"."soyisim") AS "AdSoyad",
    "Sehirler"."sehirIsmi" AS "Sehir",
    birlestir_ucret_para_birimi("Kira"."ucret", "ParaBirimi"."birimKisaltma") AS "ucret",
    kalan_ay_hesapla("Kira"."bitisTarihi") AS "Kalan_Ay",
    birlestir_ucret_para_birimi(
        hesapla_kalan_kira_tutari("Kira"."bitisTarihi", "Kira"."ucret"::NUMERIC)::MONEY,
        "ParaBirimi"."birimKisaltma"
    ) AS "Kalan_Kira_Tutari"
FROM "sema1"."Mulkler"
JOIN "sema1"."MulkTipleri" ON "MulkTipleri"."mulkTipiNo" = "Mulkler"."mulkTipiNo"
LEFT JOIN "sema1"."Kira" ON "Kira"."mulkNo" = "Mulkler"."mulkNo"
LEFT JOIN "sema1"."Kiracilar" ON "Kiracilar"."kiraciNo" = "Kira"."kiraciNo"
LEFT JOIN "sema1"."Sehirler" ON "Sehirler"."sehirNo" = "Mulkler"."sehirNo"
LEFT JOIN "sema1"."ParaBirimi" ON "ParaBirimi"."paraBirimiNo" = "Kira"."paraBirimiNo";
        `;

        const result = await istemci.query(query);
        res.json(result.rows); // Mülkler verisini JSON olarak frontend'e gönder
    } catch (error) {
        console.error('Mülkler verisi yüklenirken hata oluştu:', error);
        res.status(500).send('Mülkler verisi yüklenirken hata oluştu.');
    }
});


app.get('/api/mulkler/arama', async (req, res) => {
    const query = req.query.query || ''; // Kullanıcıdan gelen arama sorgusu

    try {
        // Sorguyu PostgreSQL için uygun şekilde güncelle
        const sql = `
            SELECT
    "Mulkler"."mulkTipiNo",
    "Mulkler"."mulkNo",
    "Mulkler"."mulkAdi",
    "Kira"."kiraNo",
    "MulkTipleri"."mulkTipiAdi" AS "Mülk_Tipi",
    birlestir_isim_soyisim("Kiracilar"."isim", "Kiracilar"."soyisim") AS "AdSoyad",
    "Sehirler"."sehirIsmi" AS "Sehir",
    birlestir_ucret_para_birimi("Kira"."ucret", "ParaBirimi"."birimKisaltma") AS "ucret",
    kalan_ay_hesapla("Kira"."bitisTarihi") AS "Kalan_Ay",
    birlestir_ucret_para_birimi(
        hesapla_kalan_kira_tutari("Kira"."bitisTarihi", "Kira"."ucret"::NUMERIC)::MONEY,
        "ParaBirimi"."birimKisaltma"
    ) AS "Kalan_Kira_Tutari"
FROM "sema1"."Mulkler"
JOIN "sema1"."MulkTipleri" ON "MulkTipleri"."mulkTipiNo" = "Mulkler"."mulkTipiNo"
LEFT JOIN "sema1"."Kira" ON "Kira"."mulkNo" = "Mulkler"."mulkNo"
LEFT JOIN "sema1"."Kiracilar" ON "Kiracilar"."kiraciNo" = "Kira"."kiraciNo"
LEFT JOIN "sema1"."Sehirler" ON "Sehirler"."sehirNo" = "Mulkler"."sehirNo"
LEFT JOIN "sema1"."ParaBirimi" ON "ParaBirimi"."paraBirimiNo" = "Kira"."paraBirimiNo"
            WHERE LOWER("Mulkler"."mulkAdi") LIKE $1;`;

        const values = [`%${query.toLowerCase()}%`]; // Sorgu parametresi

        // Veritabanından verileri çek
        const result = await istemci.query(sql, values);
        res.json(result.rows); // Filtrelenmiş verileri frontend'e döndür
    } catch (error) {
        console.error('Arama sırasında hata oluştu:', error);
        res.status(500).json({ mesaj: 'Arama sırasında bir hata oluştu.', hata: error.message });
    }
});





app.get('/api/mulkdetay', async (req, res) => {
    const mulkTipiNo = req.query.mulkTipiNo;
    const mulkNo = req.query.mulkNo;

    try {
        let query = '';
        let values = [mulkNo];

        if (mulkTipiNo == 1) {
            query = `
SELECT
    "Mulkler"."mulkAdi",
    "Mulkler"."metreKare",
    "MulkTipleri"."mulkTipiAdi",
    sema1.format_adres(
        "Ulkeler"."ulkeIsmi",
        "Sehirler"."sehirIsmi",
        "Ilceler"."ilceIsmi",
        "Mahalleler"."mahalleIsmi",
        "Sokaklar"."sokakIsmi",
        "Konutlar"."apartmanNo"::TEXT,
        "Konutlar"."daireNo"::TEXT,
        "Mulkler"."postaKodu",
        "Mulkler"."adresMetni"
    ) AS "tam_adres",
    "Konutlar"."binaYasi",
    "Konutlar"."katSayisi",
    "Konutlar"."banyoSayisi",
    "Konutlar"."mobilyali",
    "Konutlar"."asansorlu",
    "Konutlar"."otopark",
    "Konutlar"."balkon",
    "Konutlar"."site",
    "Konutlar"."siteAdi",
    "IsitmaTur"."isitmaAdi",
    "Evtipi"."odaSayisi"
FROM "sema1"."Mulkler"
LEFT JOIN "sema1"."Konutlar" ON "Konutlar"."mulkNo" = "Mulkler"."mulkNo"
LEFT JOIN "sema1"."IsYerleri" ON "IsYerleri"."mulkNo" = "Mulkler"."mulkNo"
LEFT JOIN "sema1"."Arsalar" ON "Arsalar"."mulkNo" = "Mulkler"."mulkNo"
JOIN "sema1"."MulkTipleri" ON "MulkTipleri"."mulkTipiNo" = "Mulkler"."mulkTipiNo"
JOIN "sema1"."Sokaklar" ON "Sokaklar"."sokakNo" = "Mulkler"."sokakNo"
JOIN "sema1"."Mahalleler" ON "Mahalleler"."mahalleNo" = "Mulkler"."mahalleNo"
JOIN "sema1"."Ilceler" ON "Ilceler"."ilceNo" = "Mulkler"."ilceNo"
JOIN "sema1"."Sehirler" ON "Sehirler"."sehirNo" = "Mulkler"."sehirNo"
JOIN "sema1"."Ulkeler" ON "Ulkeler"."ulkeNo" = "Mulkler"."ulkeNo"
LEFT JOIN "sema1"."IsitmaTur" ON "IsitmaTur"."isitmaNo" = "Konutlar"."isitmaNo"
LEFT JOIN "sema1"."Evtipi" ON "Evtipi"."tipNo" = "Konutlar"."tipNo"
                WHERE "Mulkler"."mulkNo" = $1;
            `;
        }
        else if (mulkTipiNo == 2) {
            // IsYerleri tablosu ve ilgili tabloların verilerini çek
            query = `
               SELECT
                   "Mulkler"."mulkAdi",
    "Mulkler"."metreKare",
    "MulkTipleri"."mulkTipiAdi",
    sema1.format_adres(
        "Ulkeler"."ulkeIsmi",
        "Sehirler"."sehirIsmi",
        "Ilceler"."ilceIsmi",
        "Mahalleler"."mahalleIsmi",
        "Sokaklar"."sokakIsmi",
        "IsYerleri"."binaNo"::TEXT,
        "IsYerleri"."daireNo"::TEXT,
        "Mulkler"."postaKodu",
        "Mulkler"."adresMetni"
    ) AS "tam_adres",
    "Mulkler"."adresMetni",
    "Mulkler"."postaKodu",
    "IsYerleri"."binaNo",
    "IsYerleri"."daireNo",
    "IsYerleri"."binaYasi",
    "IsitmaTur"."isitmaAdi",
    "IsYerleri"."katSayisi",
    "IsYerleri"."asansorlu",
    "IsYerleri"."otopark",
    "IsYerleri"."depo"
                FROM "sema1"."Mulkler"
                JOIN "sema1"."IsYerleri" ON "IsYerleri"."mulkNo" = "Mulkler"."mulkNo"
                JOIN "sema1"."MulkTipleri" ON "MulkTipleri"."mulkTipiNo" = "Mulkler"."mulkTipiNo"
                JOIN "sema1"."Sokaklar" ON "Sokaklar"."sokakNo" = "Mulkler"."sokakNo"
                JOIN "sema1"."Mahalleler" ON "Mahalleler"."mahalleNo" = "Mulkler"."mahalleNo"
                JOIN "sema1"."Ilceler" ON "Ilceler"."ilceNo" = "Mulkler"."ilceNo"
                JOIN "sema1"."Sehirler" ON "Sehirler"."sehirNo" = "Mulkler"."sehirNo"
                JOIN "sema1"."Ulkeler" ON "Ulkeler"."ulkeNo" = "Mulkler"."ulkeNo"
                LEFT JOIN "sema1"."IsitmaTur" ON "IsitmaTur"."isitmaNo" = "IsYerleri"."isitmaNo"
                WHERE "Mulkler"."mulkNo" = $1;
            `;
        }
        else if (mulkTipiNo == 3) {
            // Arsalar
            query = `
                SELECT
    "Mulkler"."mulkAdi",
    "Mulkler"."metreKare",
    "MulkTipleri"."mulkTipiAdi",
    sema1.format_adres(
        "Ulkeler"."ulkeIsmi",
        "Sehirler"."sehirIsmi",
        "Ilceler"."ilceIsmi",
        "Mahalleler"."mahalleIsmi",
        "Sokaklar"."sokakIsmi",
        NULL,
        NULL,
        "Mulkler"."postaKodu",
        "Mulkler"."adresMetni"
    ) AS "tam_adres",
    "Arsalar"."parselNo"
FROM "sema1"."Mulkler"
JOIN "sema1"."Arsalar" ON "Arsalar"."mulkNo" = "Mulkler"."mulkNo"
JOIN "sema1"."MulkTipleri" ON "MulkTipleri"."mulkTipiNo" = "Mulkler"."mulkTipiNo"
JOIN "sema1"."Sokaklar" ON "Sokaklar"."sokakNo" = "Mulkler"."sokakNo"
JOIN "sema1"."Mahalleler" ON "Mahalleler"."mahalleNo" = "Mulkler"."mahalleNo"
JOIN "sema1"."Ilceler" ON "Ilceler"."ilceNo" = "Mulkler"."ilceNo"
JOIN "sema1"."Sehirler" ON "Sehirler"."sehirNo" = "Mulkler"."sehirNo"
JOIN "sema1"."Ulkeler" ON "Ulkeler"."ulkeNo" = "Mulkler"."ulkeNo"

                WHERE "Mulkler"."mulkNo" = $1;
            `;
        } else {
            // Diğer durumlar veya bilinmeyen mulkTipiNo
            return res.json({ mesaj: 'Geçersiz mülk tipi numarası.' });
        }

        const sonuc = await istemci.query(query, values);
        res.json(sonuc.rows);
    } catch (error) {
        console.error("Detay verisi çekilirken hata:", error);
        res.status(500).send('Detay verisi alınamadı.');
    }
});


app.use(express.static(path.join(__dirname, 'views')));



app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Tek endpoint ile tüm verileri (burada sadece mulkler) döndür
app.get('/api/alldata', (req, res) => {
    res.json(allData);
});

app.listen(port, () => {
    console.log(`Sunucu çalışıyor: http://localhost:${port}`);
});


// Yeni Kiracı Ekleme Endpoint'i
app.post('/api/kiraci-ekle', async (req, res) => {
    const { tcKimlikNo, isim, soyisim, telefonNo, dogumTarihi, meslekNo, medeniHaliNo } = req.body;

    const query = `
        INSERT INTO "sema1"."Kiracilar" 
        ("tcKimlikNo", "isim", "soyisim", "telefonNo", "dogumTarihi", "meslekNo", "medeniHaliNo") 
        VALUES ($1, $2, $3, $4, $5, $6, $7);
    `;
    const values = [tcKimlikNo, isim, soyisim, telefonNo, dogumTarihi, meslekNo, medeniHaliNo];

    try {
        await istemci.query(query, values);
        res.json({ mesaj: 'Kiracı başarıyla eklendi.' });
    } catch (error) {
        console.error('Kiracı ekleme hatası:', error);
        res.status(500).json({ mesaj: 'Kiracı eklenirken hata oluştu.' });
    }
});

// Kiracılar verisi için endpoint
app.get('/api/kiracilar', async (req, res) => {
    try {
        const query = `
            SELECT 
                "Kiracilar"."tcKimlikNo",
                "Kiracilar"."isim",
                "Kiracilar"."soyisim",
                "Kiracilar"."telefonNo",
                TO_CHAR("Kiracilar"."dogumTarihi", 'YYYY-MM-DD') AS "dogumTarihi",
                "Meslekler"."meslekAdi",
                "MedeniHaller"."medeniHali"
            FROM "sema1"."Kiracilar"
            JOIN "sema1"."Meslekler" ON "Meslekler"."meslekNo" = "Kiracilar"."meslekNo"
            JOIN "sema1"."MedeniHaller" ON "MedeniHaller"."medeniHaliNo" = "Kiracilar"."medeniHaliNo";
        `;

        const result = await istemci.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Kiracılar verisi yüklenirken hata oluştu:', error);
        res.status(500).send('Kiracılar verisi yüklenirken hata oluştu.');
    }
});




// Statik dosyalar için
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));

// Ana Sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Tüm Veriler Endpoint'i
app.get('/api/alldata', (req, res) => {
    res.json(allData);
});

// Düzenleme Sayfası Rotası
app.get('/kiraciduzene', (req, res) => {
    const kiraciId = req.query.id; // ?id=123 gibi bir query parametresini alır
    console.log(`Düzenleme sayfası için alınan Kiracı ID: ${kiraciId}`);
    res.sendFile(path.join(__dirname, 'views', 'kiraciduzene.html'));
});

app.get('/api/medeni-haller', async (req, res) => {
    try {
        const query = 'SELECT "medeniHaliNo", "medeniHali" FROM "sema1"."MedeniHaller";';
        const result = await istemci.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Medeni haller yüklenirken hata oluştu:', error);
        res.status(500).send('Medeni haller yüklenirken hata oluştu.');
    }
});

app.get('/api/meslekler', async (req, res) => {
    try {
        const query = 'SELECT "meslekNo", "meslekAdi" FROM "sema1"."Meslekler";';
        const result = await istemci.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Meslekler yüklenirken hata oluştu:', error);
        res.status(500).send('Meslekler yüklenirken hata oluştu.');
    }
});

app.put('/api/kiracilar/:id', async (req, res) => {
    const kiraciId = req.params.id;
    const { isim, soyisim, telefonNo, dogumTarihi, meslekNo, medeniHaliNo } = req.body;

    if (!kiraciId) {
        return res.status(400).json({ mesaj: 'Kiracı ID eksik.' });
    }

    const query = `
        UPDATE "sema1"."Kiracilar" 
        SET 
            "isim" = $1, 
            "soyisim" = $2, 
            "telefonNo" = $3, 
            "dogumTarihi" = $4, 
            "meslekNo" = $5, 
            "medeniHaliNo" = $6
        WHERE "tcKimlikNo" = $7;
    `;
    const values = [isim, soyisim, telefonNo, dogumTarihi, meslekNo, medeniHaliNo, kiraciId];

    try {
        const result = await istemci.query(query, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ mesaj: 'Kiracı bulunamadı.' });
        }
        res.json({ mesaj: 'Kiracı bilgileri başarıyla güncellendi.' });
    } catch (error) {
        console.error('Kiracı güncelleme hatası:', error);
        res.status(500).json({ mesaj: 'Kiracı güncellenirken bir hata oluştu.' });
    }
});

app.post('/api/mulk-ekle', async (req, res) => {
    // Gelen veriyi görmek için log
    console.log('Gelen veri:', req.body);

    const { mulkTipi, ...mulkData } = req.body; // `mulkTipi` ve diğer verileri ayır
    try {
        // 1. Adım: `Mulkler` tablosuna veri ekleme
        const mulkQuery = `
            INSERT INTO "sema1"."Mulkler" 
            ("adresMetni", "ilceNo", "mahalleNo", "metreKare", "mulkAdi", "mulkTipiNo", "postaKodu", "sehirNo", "sokakNo", "ulkeNo")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING "mulkNo";
        `;
        const mulkValues = [
            mulkData.adresMetni,
            mulkData.ilceNo,
            mulkData.mahalleNo,
            mulkData.metreKare,
            mulkData.mulkAdi,
            mulkTipi,
            mulkData.postaKodu,
            mulkData.sehirNo,
            mulkData.sokakNo,
            mulkData.ulkeNo
        ];
        const mulkResult = await istemci.query(mulkQuery, mulkValues);
        const mulkNo = mulkResult.rows[0].mulkNo; // Eklenen mülkün ID'sini alın

        // 2. Adım: Mülk Tipine Göre Alt Tablolara Veri Ekleme
        if (mulkTipi == 1) { // Konut
            const konutQuery = `
                INSERT INTO "sema1"."Konutlar" 
                ("apartmanNo", "asansorlu", "balkon", "banyoSayisi", "binaYasi", "daireNo", 
                 "isitmaNo", "katSayisi", "mobilyali", "otopark", "site", "siteAdi", "tipNo", "mulkNo")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);
            `;
            const konutValues = [
                mulkData.apartmanNo, mulkData.asansorlu, mulkData.balkon, mulkData.banyoSayisi,
                mulkData.binaYasi, mulkData.daireNo, mulkData.isitmaNo, mulkData.katSayisi,
                mulkData.mobilyali, mulkData.otopark, mulkData.site, mulkData.siteAdi,
                mulkData.tipNo, mulkNo
            ];
            await istemci.query(konutQuery, konutValues);
        } else if (mulkTipi == 2) { // İş Yeri
            const isYeriQuery = `
                INSERT INTO "sema1"."IsYerleri" 
                ("asansorlu", "binaNo", "binaYasi", "daireNo", "depo", "isitmaNo", 
                 "katSayisi", "otopark", "mulkNo")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
            `;
            const isYeriValues = [
                mulkData.asansorlu, mulkData.binaNo, mulkData.binaYasi, mulkData.daireNo,
                mulkData.depo, mulkData.isitmaNo, mulkData.katSayisi, mulkData.otopark, mulkNo
            ];
            await istemci.query(isYeriQuery, isYeriValues);
        } else if (mulkTipi == 3) { // Arsa
            const arsaQuery = `
                INSERT INTO "sema1"."Arsalar" 
                ("parselNo", "mulkNo")
                VALUES ($1, $2);
            `;
            const arsaValues = [mulkData.parselNo, mulkNo];
            await istemci.query(arsaQuery, arsaValues);
        } else {
            throw new Error('Geçersiz mülk tipi');
        }

        // Başarılı yanıt
        res.json({ mesaj: 'Mülk başarıyla kaydedildi.' });
    } catch (error) {
        // Hata durumunda logla ve kullanıcıya mesaj gönder
        console.error('Mülk ekleme hatası:', error);
        res.status(500).json({ mesaj: 'Mülk eklenirken bir hata oluştu.', hata: error.message });
    }
});


app.get('/api/ulkeler', async (req, res) => {
    try {
        const result = await istemci.query(
            'SELECT "ulkeNo" AS id, "ulkeIsmi" AS name FROM "sema1"."Ulkeler";'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Ülkeler yüklenirken hata:', error);
        res.status(500).json({ mesaj: 'Ülkeler yüklenirken bir hata oluştu.', hata: error.message });
    }
});



// Şehir API'si
app.get('/api/sehirler', async (req, res) => {
    try {
        const result = await istemci.query(
            'SELECT "sehirNo" AS id, "sehirIsmi" AS name FROM "sema1"."Sehirler";'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Şehirler yüklenirken hata:', error);
        res.status(500).json({ mesaj: 'Şehirler yüklenirken bir hata oluştu.', hata: error.message });
    }
});


// İlçe API'si
app.get('/api/ilceler', async (req, res) => {
    try {
        const result = await istemci.query(
            'SELECT "ilceNo" AS id, "ilceIsmi" AS name FROM "sema1"."Ilceler";'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('İlçeler yüklenirken hata:', error);
        res.status(500).json({ mesaj: 'İlçeler yüklenirken bir hata oluştu.', hata: error.message });
    }
});


// Mahalle API'si
app.get('/api/mahalleler', async (req, res) => {
    try {
        const result = await istemci.query(
            'SELECT "mahalleNo" AS id, "mahalleIsmi" AS name FROM "sema1"."Mahalleler";'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Mahalleler yüklenirken hata:', error);
        res.status(500).json({ mesaj: 'Mahalleler yüklenirken bir hata oluştu.', hata: error.message });
    }
});


// Sokak API'si
app.get('/api/sokaklar', async (req, res) => {
    try {
        const result = await istemci.query(
            'SELECT "sokakNo" AS id, "sokakIsmi" AS name FROM "sema1"."Sokaklar";'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Sokaklar yüklenirken hata:', error);
        res.status(500).json({ mesaj: 'Sokaklar yüklenirken bir hata oluştu.', hata: error.message });
    }
});


// Isıtma Türleri API'si
app.get('/api/isitma-turleri', async (req, res) => {
    try {
        const query = 'SELECT "isitmaNo" AS id, "isitmaAdi" AS name FROM "sema1"."IsitmaTur";';
        const result = await istemci.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Isıtma türleri sorgusunda hata:', error); // Daha detaylı hata konsola yazılır
        res.status(500).json({ mesaj: 'Isıtma türleri yüklenirken bir hata oluştu.', hata: error.message });
    }
});

// Ev Tipi API'si
app.get('/api/ev-tipleri', async (req, res) => {
    try {
        const query = 'SELECT "tipNo" AS id, "odaSayisi" AS name FROM "sema1"."Evtipi";';
        const result = await istemci.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Ev tipleri sorgusunda hata:', error); // Daha detaylı hata konsola yazılır
        res.status(500).json({ mesaj: 'Ev tipleri yüklenirken bir hata oluştu.', hata: error.message });
    }
});


app.put('/api/kira-guncelle/:kiraNo', async (req, res) => {
    try {
        const { kiraNo } = req.params;
        const { baslangicTarihi, bitisTarihi, kiraUcreti, paraBirimiNo } = req.body;

        // Veri doğrulama
        const birimId = Number(paraBirimiNo) || null;
        const ucret = parseFloat(kiraUcreti) || null;

        if (!kiraNo || !birimId || !ucret || !baslangicTarihi || !bitisTarihi) {
            throw new Error('Tüm alanlar doldurulmalıdır.');
        }

        // Kira güncelleme sorgusu
        const query = `
            UPDATE "sema1"."Kira"
            SET "baslangicTarihi" = $1,
                "bitisTarihi" = $2,
                "ucret" = $3,
                "paraBirimiNo" = $4
            WHERE "kiraNo" = $5
        `;
        const values = [baslangicTarihi, bitisTarihi, ucret, birimId, kiraNo];

        await istemci.query(query, values);

        res.json({ mesaj: 'Kira başarıyla güncellendi.' });
    } catch (error) {
        console.error('Kira güncellenirken hata:', error);
        res.status(500).json({ mesaj: 'Kira güncellenirken bir hata oluştu.', hata: error.message });
    }
});



app.get('/api/kiralanabilir-kiracilar', async (req, res) => {
    try {
        const result = await istemci.query(
            ` SELECT "kiraciNo" AS id, birlestir_isim_soyisim("Kiracilar"."isim", "Kiracilar"."soyisim") AS name FROM "sema1"."Kiracilar"
             WHERE NOT EXISTS(
                SELECT 1 FROM "sema1"."Kira" WHERE "Kiracilar"."kiraciNo" = "Kira"."kiraciNo"
            );
       ` );
        res.json(result.rows);
    } catch (error) {
        console.error('Kiracılar yüklenirken hata:', error);
        res.status(500).json({ mesaj: 'Kiracılar yüklenirken bir hata oluştu.', hata: error.message });
    }
});



app.get('/api/para-birimleri', async (req, res) => {
    try {
        const result = await istemci.query(
            `SELECT "paraBirimiNo" AS id, CONCAT("birimAdi", ' (', "birimKisaltma", ')') AS name FROM "sema1"."ParaBirimi";`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Para birimleri yüklenirken hata:', error);
        res.status(500).json({ mesaj: 'Para birimleri yüklenirken bir hata oluştu.', hata: error.message });
    }
});


app.post('/api/kira-ekle', async (req, res) => {
    console.log("Gelen veri:", req.body);

    try {
        // Verileri al
        const {
            evNo,
            kiraciNo,
            baslangicTarihi,
            bitisTarihi,
            kiraUcreti,
            paraBirimiNo
        } = req.body;

        // Verileri doğrula ve dönüştür
        const evId = Number(evNo) || null;
        const kiraciId = Number(kiraciNo) || null;
        const birimId = Number(paraBirimiNo) || null;
        const ucret = parseFloat(kiraUcreti) || null;

        if (!evId || !kiraciId || !birimId || !ucret) {
            throw new Error('Geçersiz veri. Tüm alanlar doldurulmalıdır.');
        }

        // Kira tablosuna ekleme
        const query =
            `   INSERT INTO "sema1"."Kira"
                ("mulkNo", "kiraciNo", "baslangicTarihi", "bitisTarihi", "ucret", "paraBirimiNo")
        VALUES($1, $2, $3, $4, $5, $6)
            ;`
        const values = [evId, kiraciId, baslangicTarihi, bitisTarihi, ucret, birimId];

        await istemci.query(query, values);

        res.json({ mesaj: 'Kira başarıyla kaydedildi.' });
    } catch (error) {
        console.error('Kira eklenirken hata:', error);
        res.status(500).json({ mesaj: 'Kira eklenirken bir hata oluştu.', hata: error.message });
    }
});

app.get('/api/kiralanabilir-evler', async (req, res) => {
    try {
        const result = await istemci.query(
            `SELECT "mulkNo" AS id, "mulkAdi" AS name FROM "sema1"."Mulkler" 
             WHERE "mulkTipiNo" = 1 AND NOT EXISTS (
                SELECT 1 FROM "sema1"."Kira" WHERE "Mulkler"."mulkNo" = "Kira"."mulkNo"
             );`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Evler yüklenirken hata:', error);
        res.status(500).json({ mesaj: 'Evler yüklenirken bir hata oluştu.', hata: error.message });
    }
});


app.delete('/api/kiracilar/:id', async (req, res) => {
    const kiraciId = req.params.id;

    try {
        // Kiracıyı veritabanından silmek için sorgu
        const query = `DELETE FROM "sema1"."Kiracilar" WHERE "tcKimlikNo" = $1;;`
        await istemci.query(query, [kiraciId]);

        res.json({ mesaj: 'Kiracı başarıyla silindi.' });
    } catch (error) {
        console.error('Kiracı silme hatası:', error);
        res.status(500).json({ mesaj: 'Kiracı kirada olduğu için silinmedi.' });
    }
});



app.get('/api/mulk-toplam', async (req, res) => {
    try {
        const result = await istemci.query(`
            SELECT toplam_konut, toplam_isyeri, toplam_arsa
            FROM "sema1"."Mulk_Toplam"
            WHERE id = 1
        `);

        if (result.rows.length === 0) {
            return res.status(404).json({ mesaj: 'Toplam verisi bulunamadı.' });
        }

        res.json(result.rows[0]); // toplam_konut, toplam_isyeri, toplam_arsa
    } catch (error) {
        console.error('Mülk toplam bilgileri alınırken hata:', error);
        res.status(500).json({ mesaj: 'Mülk toplam bilgileri alınırken bir hata oluştu.' });
    }
});
