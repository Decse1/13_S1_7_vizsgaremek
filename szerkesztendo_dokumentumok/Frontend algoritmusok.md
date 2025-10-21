Frontend algoritmusok:



### \- Felhasználónév és jelszó ellenőrzés a szervernek küldés előtt:



Form: BejelentkezoForm

    Mezők:

        - fnev

        - jelszo

    Gomb:

        - Bejelentkezés



Amikor a Bejelentkezés gombra kattintanak:

    felhasznalonev = BejelentkezoForm.felhasznalonev.ertek

    jelszo = BejelentkezoForm.jelszo.ertek

 

    # 1. Ellenőrzés

    hibaUzenet = EllenorizFelhasznalonevEsJelszo(felhasznalonev, jelszo)

 

    Ha hibaUzenet != "Sikeres ellenőrzés":

        Megjelenít hibaUzenet a felhasználónak

        Megállítja a további feldolgozást

    Egyébként:

        # 2. Küldés a szervernek

        response = KuldesSzervernek(felhasznalonev, jelszo)

        Megjelenít response a felhasználónak



Függvény EllenorizFelhasznalonevEsJelszo(felhasznalonev, jelszo):

    MAX\_HOSSZ = 100

 

    Ha felhasznalonev ÜRES VAGY jelszo ÜRES:

        Visszaad "Hiba: Minden mezőt ki kell tölteni."

 

    Ha hossza(felhasznalonev) > MAX\_HOSSZ VAGY hossza(jelszo) > MAX\_HOSSZ:

        Visszaad "Hiba: A mezők hossza nem lehet több, mint 100 karakter."

 

    Visszaad "Sikeres ellenőrzés"

 

Függvény KuldesSzervernek(felhasznalonev, jelszo):

    adat = { "felhasznalonev": felhasznalonev, "jelszo": jelszo }

    response = POST("https://szerver.hu/login", adat)

 

    Ha response sikeres:

        Visszaad "Sikeres bejelentkezés"

    Egyébként:

        Visszaad "Hiba a szerverrel"

 

 

 

### \- Webshop kosár



Kosár tárolása cookie-k formájában történik, 14 napig érvényes a cookie, minden változáskor ez újrakezdődik.

A kosár tartalma JSON-ben van.



COOKIE FÜGGVÉNYEK



Függvény SetCookie(név, érték, lejáratNapok):

    lejáratiDátum = jelenlegiDátum + lejáratNapok

    cookie = név + "=" + URLencode(érték) + "; expires=" + lejáratiDátum + "; path=/"

    dokumentum.cookie = cookie



Függvény GetCookie(név):

    cookieLista = dokumentum.cookie.split(";")

    Minden cookieElem a cookieLista-ban:

        \[cookieNév, cookieÉrték] = cookieElem.split("=")

        Ha trim(cookieNév) == név:

            Visszatér URLdecode(cookieÉrték)

    Visszatér null



KOSÁR KEZELÉSE



Kosár lekérése:

Függvény GetCart(felhasznalo.id):

    cookieNév = "cart\_" + felhasznalo.id

    cartJSON = GetCookie(cookieNév)

    Ha cartJSON == null:

        Visszatér üres lista

    Egyébként:

        Visszatér JSONparse(cartJSON)



Kosár mentése:

Függvény SaveCart(felhasznalo.id, kosar):

    cookieNév = "cart\_" + felhasznalo.id

    cartJSON = JSONstringify(kosar)

    SetCookie(cookieNév, cartJSON, 14)  // 14 napig érvényes





TERMÉK HOZZÁADÁSA



Függvény AddToCart(felhasznalo.id, termek.id, termek.nev, termek.tulajdonos, termek.ar, kosarmennyiseg):

    kosar = GetCart(felhasznalo.id)

    Ha kosar nem üres

 	elsoTulajdonos = kosar\[0].tulajdonos

 	Ha elsoTulajdonos != termek.tulajdonos

 	    Kiír("Másik tulajdonos termékét próbálod hozzáadni. A kosár törlődik.")

 	    kosar = üres lista

    talált = HAMIS

    Minden elem a kosár-ban:

        Ha elem.id == termek.id:

            elem.kosarmennyiseg += kosarmennyiseg

            talált = IGAZ

            Megszakít

    Ha talált == HAMIS:

        Kosárhoz hozzáad({id: termek.id, nev: név, tulajdonos: termek.tulajdonos, ar: termek.ar, kosarmennyiseg: kosarmennyiseg})

    SaveCart(felhasznalo.id, kosar)





TERMÉK ELTÁVOLÍTÁSA



Függvény RemoveFromCart(felhasznalo.id, termek.id):

    kosar = GetCart(felhasználó)

    ujKosar = minden elem a kosár-ban, ami elem.id != termek.id

    SaveCart(felhasznalo.id, ujKosar)





KOSÁR MEGJELENÍTÉSE ÉS ÖSSZÉRTÉK



Függvény ViewCart(felhasznalo.id):

    kosar = GetCart(felhasznalo.id)

    teljesÉrték = 0

    Minden elem a kosar-ban:

        elemÖsszesen = elem.ar \* elem.kosarmennyiseg

        teljesÉrték += elemÖsszesen

        Kiír("Termék:", elem.nev, "Partner:", elem.tulajdonos, "Mennyiség:", elem.kosarmennyiseg, "Egységár:", elem.ar, "Összesen:", elemÖsszesen)

    Kiír("Kosár összértéke:", teljesÉrték)

    Visszatér kosar, teljesÉrték





KOSÁR ÜRÍTÉSE



Függvény ClearCart(felhasznalo.id):

    SaveCart(felhasznalo.id, üres lista)







### Frontend kapcsolat a raktár oldalon:

(axios szükséges)

(products-ba tömbök -> id, nev, mennyiseg)



Kezdet:



  Létrehozunk egy alkalmazást (app), ami a #app elemhez kötődik



  Inicializáláskor:

    products ← üres lista

    loading ← igaz

    error ← üres



  Függvény: fetchProducts()

    Állítsd loading ← igaz

    Állítsd error ← üres



    Próbáld meg:

      Küldj GET kérést az "/api/termek" címre

      Ha a válasz sikeres:

        products ← a válaszban kapott adatok

    Ha hiba történik:

      Írd ki a hibát a konzolra

      error ← "Nem sikerült lekérni az adatokat."

    Végül:

      Állítsd loading ← hamis



  Amikor az alkalmazás betöltődik (mounted):

    Hívd meg a fetchProducts() függvényt



  Megjelenítés:

    Ha loading igaz → jelenítsd meg: "Betöltés..."

    Ha error nem üres → jelenítsd meg az error üzenetet

    Egyébként:

      Jelenítsd meg a products lista elemeit egy táblázatban



Vége.





### Frontend kapcsolat a beérkezett rendelések lista oldalon:



(axios szükséges)

(orders-ba tömbök -> rendeles.id, ceg.nev, rendeles.datum)



Kezdet:



&nbsp; Hozz létre egy alkalmazást (app), ami a #app DOM elemhez kapcsolódik



&nbsp; Inicializáláskor (data):

&nbsp;   orders ← üres lista

&nbsp;   loading ← igaz

&nbsp;   error ← üres



&nbsp; Függvény: fetchOrders()

&nbsp;   Állítsd loading ← igaz

&nbsp;   Állítsd error ← üres



&nbsp;   Próbáld meg:

&nbsp;     Küldj GET kérést az "/api/orders" címre

&nbsp;     Ha a válasz sikeres:

&nbsp;       orders ← a válaszban kapott adatok (tömb objektumokkal)

&nbsp;   Ha hiba történik:

&nbsp;     Írd ki a hibát a konzolra

&nbsp;     error ← "Nem sikerült lekérni az adatokat."

&nbsp;   Végül:

&nbsp;     loading ← hamis



&nbsp; Amikor az alkalmazás betöltődik (mounted):

&nbsp;   Hívd meg a fetchOrders() függvényt



&nbsp; Megjelenítés a DOM-ban:

&nbsp;   Ha loading igaz → jelenítsd meg: "Betöltés..."

&nbsp;   Ha error nem üres → jelenítsd meg az error üzenetet

&nbsp;   Ellenkező esetben:

&nbsp;     Jelenítsd meg a orders lista elemeit egy táblázatban:

&nbsp;       - Rendelési azonosító

&nbsp;       - Megrendelő

&nbsp;       - Rendelési dátum



Vége.





### Frontend kapcsolat egy beérkezett rendelés oldalán:



Kezdet:



&nbsp; Hozz létre egy alkalmazást (app), ami a #app DOM elemhez kapcsolódik



&nbsp; Inicializáláskor (data):

&nbsp;   order ← null               // a rendelés objektuma

&nbsp;   loading ← igaz             // betöltés állapot

&nbsp;   error ← null               // hibaüzenet



&nbsp; Függvény: fetchOrder()

&nbsp;   Állítsd loading ← igaz

&nbsp;   Állítsd error ← null

&nbsp;   orderId ← "AA000001"      // lekérdezendő rendelés azonosító



&nbsp;   Próbáld meg:

&nbsp;     Küldj GET kérést az "/api/order/{orderId}" címre

&nbsp;     Ha a válasz sikeres:

&nbsp;       order ← a válaszban kapott rendelés adatai (egy objektum)

&nbsp;   Ha hiba történik:

&nbsp;     Írd ki a hibát a konzolra

&nbsp;     error ← "Nem sikerült lekérni a rendelés adatait."

&nbsp;   Végül:

&nbsp;     loading ← hamis



&nbsp; Amikor az alkalmazás betöltődik (mounted):

&nbsp;   Hívd meg a fetchOrder() függvényt



&nbsp; Megjelenítés a HTML DOM-ban:

&nbsp;   Ha loading igaz → jelenítsd meg: "Betöltés..."

&nbsp;   Ha error nem üres → jelenítsd meg az error üzenetet

&nbsp;   Ellenkező esetben:

&nbsp;     Jelenítsd meg az order objektum adatait

Vége.











mi kellhet még:

* egy beérkezett rendelés oldala és annak adatainak kiírása
* cég adatok:
  cég adatai kiírása
  előfizetési státusz
  alkalmazotti lista
  esetleg alkalmazott adatai
* cég adatainak módosítása:
  megadott adatok módosítása és ellenőrzése
  alkalmazott felvétele (+ megadott adatok ellenőrzése)
* eladói és vevői partnerségek kilistázása
* új eladói partnerség felvétele, ott adatok ellenőrzése
* áruház:
  szerződött partnerek kilistázása, termékeinek kilistázása
* leadott rendelések listázása
  leadott rendelés adatainak megjelenítése annak megnyitásakor
  



