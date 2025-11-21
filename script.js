/* ============================
   KONUM AL VE ŞEHİR BUL
=============================== */

// Sayfa açılır açılmaz konumu iste
konumuAl();

function konumuAl() {
  if (!navigator.geolocation) {
    console.log("Cihaz konum desteği vermiyor.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    konumBasarili,
    konumHata,
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

async function konumBasarili(pos) {
  let lat = pos.coords.latitude;
  let lon = pos.coords.longitude;

  console.log("Konum alındı:", lat, lon);

  // OpenStreetMap Reverse Geocode (şehir bulma)
  let url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

  try {
    let cevap = await fetch(url);
    let json = await cevap.json();

    let city =
      json.address.city ||
      json.address.town ||
      json.address.village ||
      json.address.county ||
      null;

    if (!city) {
      console.log("Şehir bulunamadı, varsayılan İzmir kullanıldı.");
      city = "İzmir";
    }

    sehir = city;
    document.getElementById("sehir").innerText = sehir;

    vakitleriAl(); // Şehri bulunca vakitleri tekrar çek

  } catch (err) {
    console.log("Ters geocode hatası:", err);
  }
}

function konumHata(err) {
  console.log("Konum alınamadı:", err);
  // Kullanıcı izin vermezse, şehir aynı kalır (ör: İzmir)
}

// Tarih
// CANLI SAAT
function saatYazdir() {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, "0");
  const mm = now.getMinutes().toString().padStart(2, "0");
  const ss = now.getSeconds().toString().padStart(2, "0");
  document.getElementById("saat-canli").innerText = `${hh}:${mm}:${ss}`;
}

saatYazdir();                 // sayfa açılır açılmaz yazsın
setInterval(saatYazdir, 1000); // her saniye güncellensin

function tarihYazdir() {
  const bugun = new Date();
  const gun = bugun.getDate().toString().padStart(2, "0");
  const ay = (bugun.getMonth() + 1).toString().padStart(2, "0");
  const yil = bugun.getFullYear();
  document.getElementById("tarih").innerText = `${gun}.${ay}.${yil}`;
}
tarihYazdir();


/* ============================
   API'DEN NAMAZ VAKİTLERİNİ ÇEK
=============================== */

let vakitler = {};  // Tüm vakitleri depolayacağız

async function vakitleriAl() {
  let url = `https://api.aladhan.com/v1/timingsByCity?city=${sehir}&country=Turkey&method=13`;

  let gelen = await fetch(url);
  let json = await gelen.json();

  let t = json.data.timings;

  // HTML'e yaz
  document.getElementById("imsak").innerText  = t.Fajr;
  document.getElementById("gunes").innerText  = t.Sunrise;
  document.getElementById("ogle").innerText   = t.Dhuhr;
  document.getElementById("ikindi").innerText = t.Asr;
  document.getElementById("aksam").innerText  = t.Maghrib;
  document.getElementById("yatsi").innerText  = t.Isha;

  // JS içinde de saklayalım
  vakitler = {
    imsak: t.Fajr,
    gunes: t.Sunrise,
    ogle: t.Dhuhr,
    ikindi: t.Asr,
    aksam: t.Maghrib,
    yatsi: t.Isha
  };

  geriSayimBaslat(); // Vakitler gelince geri sayımı başlat
}

vakitleriAl();


/* ============================
   SONRAKİ VAKTE GERİ SAYIM
=============================== */

function vakitToDate(saat) {
  const [h, m] = saat.split(":");
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  return d;
}

function geriSayimBaslat() {

  let sirali = [
    ["İmsak",  vakitler.imsak],
    ["Güneş",  vakitler.gunes],
    ["Öğle",   vakitler.ogle],
    ["İkindi", vakitler.ikindi],
    ["Akşam",  vakitler.aksam],
    ["Yatsı",  vakitler.yatsi]
  ];

  setInterval(() => {
    const simdi = new Date();

    let hedefVakitAdi = "";
    let hedef = null;

    for (let [adi, saat] of sirali) {
      let d = vakitToDate(saat);
      if (d > simdi) {
        hedef = d;
        hedefVakitAdi = adi;
        break;
      }
    }

    // Gün bitti → yarın imsak
    if (!hedef) {
      hedef = vakitToDate(vakitler.imsak);
      hedef.setDate(hedef.getDate() + 1);
      hedefVakitAdi = "İmsak";
    }

    let fark = hedef - simdi;

    let saat = Math.floor(fark / 1000 / 3600);
    let dakika = Math.floor((fark / 1000 % 3600) / 60);
    let saniye = Math.floor(fark / 1000 % 60);

    const txt = 
      `${saat.toString().padStart(2,"0")}:` +
      `${dakika.toString().padStart(2,"0")}:` +
      `${saniye.toString().padStart(2,"0")}`;

    document.getElementById("geri-sayim").innerText = txt;

  }, 1000);
}



/* ============================
   KIBLE PUSULASI – DÖNEN OK
=============================== */

// Telefonun yönünü dinle
window.addEventListener("deviceorientation", (e) => {
  let alpha = e.alpha || 0; // alpha değerini unutmuşsun
  let offset = 90; 

  let ok = document.getElementById("pusula-ok");
  ok.style.transform = `rotate(${alpha + qiblaAngle + offset}deg)`;
});
