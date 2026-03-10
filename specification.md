

Hackathon: Call Center Nowej Generacji (Voicebot + platforma dla konsultantów)

Preferowany stos i zasady użycia technologii
Celem hackathonu jest zbudowanie rozwiązania produktowego na baize LiveKit, z naciskiem na łatwe iterowanie i edycję przez osoby nietechniczne.

A) Co jest wymagane (MUST)

Orkiestracja rozmowy voice musi być oparta o LiveKit
Uczestnicy mają korzystać intensywnie z Claude Code:
Demo musi działać w web app: rozmowa głosowa klient ↔ bot.
B) Co jest dozwolone
Możecie używać zewnętrznych usług/komponentów do:

TTS (synteza mowy),
STT (rozpoznawanie mowy),
LLM.
Przykładowo dozwolone jest wykorzystanie 11labs jako:

tylko TTS, albo
TTS + STT, ale nadal cała logika rozmowy, flow, zbieranie danych, handoff i platformy muszą być po Waszej stronie i spięte przez Pipecat lub LiveKit.
C) Co jest zabronione (NOT ALLOWED)

Zbudowanie rozwiązania „w całości” w jednej zewnętrznej platformie (np. „robimy całego bota w 11lab”).
Wymaganie telefonii/integracji sieciowej, która nie przejdzie przez firewall (hackathon jest web-only).


1. Cel hackathonu
Zaprojektować i zademonstrować kompletne rozwiązanie call center nowej generacji, w którym:

Klienci są obsługiwani przez voicebota (naturalna rozmowa, zbieranie informacji, realizacja scenariuszy).
Do konsultanta trafiają wyłącznie klienci, którzy o to poprosili (eskalacja „na żądanie”).
Zespół dostarcza nie tylko bota, ale cały system: platformę do budowy voicebotów (edycja flow + promptów),
kanał voice (wodok do testowania agentów),
platformę dla konsultantów (panel agenta: rozmowy + transkrypcje itd.).
Hackathon ma wyłonić najlepsze podejścia pod kątem:

kompletności,
innowacyjności (ciekawe funkcjonalności, adresowanie realnych ryzyk),
prezentacji rozwiązania.
Dodatkowe punkty za rozwiązanie obaw klienta (czas wdrożenia, koszty, bezpieczeństwo, stabilność danych) oraz za wykrycie i zaadresowanie dodatkowych problemów/wyzwań.
Najlepsze rozwiązanie ma posłużyć jako baza do produktu dla przyszłych klientów.


2. Scenariusz biznesowy
„Zgłoszenie szkody OC”
Voicebot musi przeprowadzić użytkownika przez kompletny scenariusz zgłoszenia szkody. Tutaj możecie zainspirować się (lub po prostu wykorzystać całkowicie) gotowym system promptem, który jest na naszym koncie 11labs, link na końcu dokumentu.


3. Kluczowe wymagania
3.1. Voice App (kanał klienta)
Aplikacja webowa klienta musi umożliwiać:

start/stop sesji,
rozmowę głosową (mikrofon → STT → bot → TTS → głośnik),
podgląd transkrypcji (co mówi klient i co bot odpowiedział),
3.2. Voicebot (logika rozmowy)

Bot prowadzi rozmowę głosową (STT/TTS) i realizuje scenariusz „zgłoszenie szkody”.
Voicebot zbiera dane w sposób ustrukturyzowany (np. JSON / formularz ), z mechanizmem potwierdzania.
Tu możecie pomyśleć nad jakimś sposobem, który pomoże zapewnić pełne pokrycie zebranych danych.
3.3. Eskalacja do konsultanta (tylko na żądanie)

Użytkownik w dowolnym momencie może powiedzieć: „połącz mnie z konsultantem”.
W ramach hackathonu przełączenie na nowy numer może być zamockowane, ale musi być: jasne w UI,
zarejestrowane w logach,
przekazany kontekst do konsultanta.
Wymagane: przekazanie kontekstu

podsumowanie rozmowy,
transkrypcja,
zebrane dane.
3.4. Platforma dla nietechnicznych: Bot Builder (inspiracja: „klon platformy 11labs”)
Celem jest, by nietechniczna osoba mogła w prosty sposób aktualizować zachowanie bota.
Wymagane minimum UI:

Edycja system promptu
Edycja flow bez kodu:
Tryb testowy: możliwość uruchomienia rozmowy „testowej” na wersji draft
3.5. Platforma dla konsultantów (Agent Console)
Panel agenta musi mieć:

listę sesji/zgłoszeń,
widok szczegółów: transkrypcja,
podsumowanie,
zebrane pola,
status (w toku / zakończone / eskalowane),
3.6. Observability

logi rozmów/sesji,
metryki: czas sesji,
liczba eskalacji,
kompletność pól (np. % wymaganych slotów zebranych),
metryki kosztowe (jeśli możliwe): tokeny/zużycie per sesja lub chociaż liczba wywołań STT/TTS/LLM.


4. Problemy klienta (obszary dodatkowo punktowane)
Rozwiązanie powinno zawierać konkretne mechanizmy, nie tylko opis.
A) Szybkość wdrożenia
Klient boi się długiego wdrożenia i dużego zaangażowania po swojej stronie.
Proponowane źródła wejścia: uczestnicy otrzymają nagrania/transkrypcje rozmów z konsultantami.
Wasz cel: zaimplementować moduł, który na ich podstawie:

generuje propozycję system promptu i/lub
generuje draft flow i np. listę slotów, które trzeba zebrać.
B) Bezpieczeństwo kosztów (fraud / abuse)

limit czasu rozmowy,
limity prób,
limity eskalacji,
wykrywanie pętli / „silent sessions”,
przerywanie sesji w konkretnych sytuacjach,
C) Łatwość modyfikacji flow (nietech)

flow i sloty edytowalne w UI,
D) Bezpieczeństwo merytoryczne (prompt attacks, wulgaryzmy, off-topic)

guardrails / polityki,
refusal + redirect,
ograniczenie narzędzi (tool permissions),
fallback do bezpiecznego trybu.
E) Stabilność zbieranych informacji (kompletność danych)

zbierane dane + walidacje,
potwierdzenie krytycznych informacji,
testy rozmów.


6. Deliverables (co zespół musi oddać)
6.1. Live demo (najważniejsze)

Rozmowa web voice z botem → zebranie danych → zakończenie lub eskalacja na żądanie.
Konsultant widzi kontekst i zamyka sprawę.
6.2. Repo + uruchomienie

Repozytorium z kodem i instrukcją uruchomienia: README (lokalnie i/lub środowisko demo),
.env.example (bez sekretów),
6.3. Specyfikacja
Krótki dokument zawierający:

opis architektury,
opis zabezpieczeń kosztowych i safety,
jak działa edycja flow/prompt,
ograniczenia i ryzyka + plan dalszego rozwoju.
6.4. Prezentacja

15 minut na team: minimum slajdów,
LIVE DEMO
podział pracy, wyzwania, z czego jesteście najbardziej dumni


8. Kryteria oceny - do zmiany
8.1. Główne kryteria

Kompletność (0–40) end-to-end system: web voice + pipecat/livekit bot + builder + agent console + handoff
Innowacyjność (0–30) kreatywne funkcje, adresowanie realnych ryzyk, „wow effect”, ale sensowne biznesowo
Prezentacja rozwiązania (0–20) jakość demo, klarowność, argumentacja, pokazanie działania
8.2. Bonus (0–30 łącznie)

Szybkość wdrożenia (0–10)
Bezpieczeństwo kosztów (0–10)
Odporność na ataki / safety (0–5)
Stabilność zbierania informacji (0–5)
Ważne: bonus nie ratuje braków w Must-have.


10. Inspiracje na kreatywne funkcje

Generator flow/slotów danych do zebrania z transkryptów rozmów.
„Quality Gate”: bot nie kończy sprawy, dopóki nie ma kompletności + potwierdzenia.
„Fraud/abuse mode”: automatyczne rozpoznanie pętli i odcięcie.
„Test Suite”: zestaw predefiniowanych rozmów testowych + raport pokrycia slotów.


11. Dodatkowe źródła + kilka rad:
Gotowe komponenty, wydewelopowane przez nasz zespół do tej pory:

Voicebot na platformie 11labs w tym jego systemprompt: ElevenAgents | ElevenLabs
Repo Azure z toolami dla bota: FastVoicebotWebhooks - Repos
Moduł testów automatycznych/ataków na Voicebota: voicebot_tester - Repos
Moduł observability:FastObservability - Repos
PanelVoicebot: voicebotpanel - Repos
Platforma do testowania agenta oraz panel administratora (lovable): claimwizard
Możecie się tymi komponentami zainspirować, wykorzystać je w całości albo zrobić wszystko zupełnie od nowa. System prompt chyba warto po prostu przekleić i skupić się na dewelopmencie pozostałych modułów :)
Klucze:

nagrania call center: CallCenterRecordings
