# Legacy assets used by the GetFunnels org decks

Source list for Task 57b (copy images into our `StorageProvider`) and Task 60 (embed slide type).
Nothing here is loaded by the seed, and no deck may reference these URLs directly.

## Images on the legacy Base44 bucket (Task 57b — copied)

Copied into our private storage on 2026-10-09 as GetFunnels org assets (ids in `scripts/seed/getfunnels-org-assets.json`, script `scripts/migrate-legacy-assets.ts`). Slides reference the asset ids, never these URLs.

Base: `https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699397a847582c270176930d/`

| File | Legacy label | Used by |
|---|---|---|
| `be947c9b0_Plandetravail1gf.png` | GetFunnels logo | covers / authority (rdv 0, vsl 0+2, lancement 0, tunnel-pay 2) |
| `e47239d24_Screenshot2024-01-15at174956.png` | ClickFunnels dashboard | rdv-classique 16 |
| `dde7e058d_screencapture-contact98a72c-app-clickfunnels-funnels-11694789-stats-2023-06-21-12_23_54-2pdf.png` | ClickFunnels stats tunnel · 385 241 $ | proof carousel* |
| `15ee943fe_e5938f54-bab8-4327-ac9e-396900d6f65c.png` | Systeme.io statistiques · 143 181 € | proof carousel* |
| `40c6f6393_Designsanstitre-5.png` | ClickFunnels · 380 711 $ | proof carousel* |
| `9cc9ad52c_Designsanstitre.png` | Stats détaillées · 572 ventes | proof carousel* |
| `dad9a0640_Designsanstitre-3.png` | Challenge Connaissance · 263 818 € | proof carousel* |
| `2f1cb70a0_Designsanstitre-10.png` | Opt-in · 41 052 vues | proof carousel* |
| `fe5ecd7a1_FireShotCapture005-Systemeio-systemeiopdf-2.png` | Vue globale · 257 386 € | proof carousel* |
| `34e3beb60_Designsanstitre-9.png` | Tunnel REBORN · 3 608 200 € | proof carousel* |
| `f472c6fdc_Designsanstitre-7.png` | 49 348 vues · opt-in 41,4 % | proof carousel* |
| `89f3885f6_Designsanstitre-8.png` | Récap global (panier moyen 406,97 €) | proof carousel* |

\* The same 10-screenshot carousel: vsl-funnel 19, evergreen 17, tunnel-pay 20, lancement-orchestre 20, tunnel-webinaire 18.

## Live client pages shown as iframes in the legacy galleries (Task 60)

- **rdv-classique 15:** getfunnels.clickfunnels.com/{mybusiness-passion, seller-performance62302995, page-client-top-paris-20251752750759796, page-de-vente1660681095320, page-de-vente1679918951707, sales-page-21723544964423} · immersion.video-ads-agency.com/presentation_v2 · digitalspeak-sarl.systeme.io/finances-liberte-v2-4f7a5056
- **vsl-funnel 18 / tunnel-pay 19:** getfunnels.agency/viral_script_vsl-v3 · getfunnels.clickfunnels.com/{programme-ambassadeurs, arthaud_immobilier, optin1745946068279} · by.getfunnels.agency/reborn · go-scale.systems/vsl
- **evergreen 16:** getfunnels.clickfunnels.com/optin1679655893734 · getfunnels.agency/{thami-kabbaj-optin-page, viral_script_optin-v2, horizon-optin} · immersion.video-ads-agency.com/presentation_v2 · digitalspeak-sarl.systeme.io/{closing-influence-op, amani-invest}
- **lancement-orchestre 19:** getfunnels.clickfunnels.com/{page-client-top-paris-20251752750759796, sales-page-21723544964423, optin1745573138721, optin1725636488541, page-d-inscription} · by.getfunnels.agency/{fba-inscription-challenge-6ad547e2, bfb96d50}
- **tunnel-webinaire 17:** getfunnels.clickfunnels.com/{optin1679655893734, taylor-chiche1614367819828, optin1748423326374dd, edgar-gropiron1621415541184} · by.getfunnels.agency/{bfb96d50, fba-inscription-challenge-6ad547e2} · www.getfunnels.agency/{horizon-optin, thami-kabbaj-optin-page}
