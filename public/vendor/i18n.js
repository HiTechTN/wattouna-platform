const LANGS = {
  "ar-TN": {
    /* Tunisian darija, Arabic script. Default locale. */
    name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u062A\u0648\u0646\u0633\u064A\u0629",
    dir: "rtl",
    plur: (n) => n === 1 ? "1" : "2",
    strings: {
      /* Navigation / brand */
      "nav.menu": "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0646\u0635\u0629",
      "nav.community": "\u0627\u0644\u0645\u062C\u062A\u0645\u0639",
      "nav.components": "\u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A",
      "nav.about": "\u0639\u0646 Wattouna",
      "nav.login": "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644",
      "nav.signup": "\u0627\u062D\u062A\u0633\u0627\u0628 \u062D\u0633\u0627\u0628",
      "nav.becomeMaker": "\u0635\u0627\u0646\u0639 \u0645\u062E\u062A\u0628\u0631\u061F",
      "nav.settings": "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
      "nav.volunteer": "\u062A\u0637\u0648\u0651\u0639",
      "brand.title": "\u0648\u0627\u0637\u0646\u0627 \u2014 \u0637\u0627\u0642\u0629 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u062F\u0648\u064A\u0631",
      "meta.title": "\u0645\u0646\u0635\u0629 Wattouna \u2014 \u0637\u0627\u0642\u0629 \u0634\u0645\u0633\u064A\u0629 \u0648\u0645\u0646\u0627\u0637\u0642 DIY",
      "meta.desc": "\u0645\u0646\u0635\u0629 \u0645\u0641\u062A\u0648\u062D\u0629 \u0627\u0644\u0645\u0635\u062F\u0631 \u0644\u0644\u0637\u0627\u0642\u0629 \u0627\u0644\u0634\u0645\u0633\u064A\u0629 DIY \u0648\u0625\u0639\u0627\u062F\u0629 \u062A\u062F\u0648\u064A\u0631 \u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0627\u062A. \u0645\u0634\u0631\u0648\u0639 PBX-36: \u0645\u0648\u0644\u062F \u0634\u0645\u0633\u064A 36 \u0641\u0648\u0644\u062A\u061F",
      "brand.tagline": "\u0637\u0627\u0642\u0629 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u062F\u0648\u064A\u0631\u060C \u0634\u0645\u0627\u0644 \u0627\u0644\u0637\u0631\u064A\u0642\u0629.",
      /* Workbench */
      "wb.title": "\u0627\u0644\u0645\u062E\u062A\u0628\u0631 \u2014 \u0644\u0648\u062D\u0629 \u062F\u0648\u0627\u0626\u0631 \u0627\u0644\u0635\u0627\u0646\u0639\u064A\u0646",
      "wb.kicker": "\u0645\u062E\u062A\u0628\u0631 \u0627\u0644\u0635\u0627\u0646\u0639\u064A\u0646 \u2014 Maker Canvas",
      "wb.headline": "\u0631\u0643\u0651\u0628 \u062F\u0627\u0626\u0631\u062A\u0643 \u0628\u0627\u0644\u0633\u062D\u0628 \u0648\u0627\u0644\u062A\u0648\u0635\u064A\u0644",
      "wb.help": "\u0627\u0646\u0642\u0631 \u0637\u0631\u0641\u064B\u0627 (\u064A\u0644\u0645\u0639) \u062B\u0645 \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u062B\u0627\u0646\u064A \u0644\u0631\u0633\u0645 \u0633\u0644\u0643 \u2022 \u0646\u0642\u0631\u0629 \u0645\u0632\u062F\u0648\u062C\u0629/\u0632\u0631 \u0623\u064A\u0645\u0646 \u0644\u062D\u0630\u0641 \u0633\u0644\u0643 \u2022 \u0627\u0633\u062D\u0628 \u0627\u0644\u0643\u0648\u0646 \u0645\u0646 \u0631\u0623\u0633\u0647\u0627 \u2022 \u25B6\uFE0F \u0627\u0628\u062F\u0623 \u0627\u0644\u0645\u062D\u0627\u0643\u0627\u0629 \u062B\u0645 \u0627\u0646\u0642\u0631 \u0627\u0644\u0623\u0632\u0631\u0627\u0631 \u2022 \u25B6\uFE0F\u51AF \u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u062F\u0627\u0631\u0629 \u2022 \u064A\u0639\u0645\u0644 \u0628\u0627\u0644\u0644\u0645\u0633 \u{1F4F1}",
      "wb.toolbar_name": "\u0627\u0633\u0645 \u0627\u0644\u0645\u0634\u0631\u0648\u0639",
      "wb.toolbar_color": "\u0644\u0648\u0646 \u0627\u0644\u0633\u0644\u0643",
      "wb.color.red": "\u0623\u062D\u0645\u0631 (+)",
      "wb.color.black": "\u0623\u0633\u0648\u062F (GND)",
      "wb.color.orange": "\u0628\u0631\u062A\u0642\u0627\u0644\u064A (\u062A\u0645\u0627\u0633)",
      "wb.color.blue": "\u0623\u0632\u0631\u0642 (+12V)",
      "wb.color.green": "\u0623\u062E\u0636\u0631 (\u0645\u0646\u0637\u0642)",
      "wb.btn_simulation": "\u0628\u062F\u0621 \u0627\u0644\u0645\u062D\u0627\u0643\u0627\u0629",
      "wb.btn_stop": "\u0625\u064A\u0642\u0627\u0641",
      "wb.btn_validate": "\u0641\u062D\u0635 \u0627\u0644\u062A\u0648\u0635\u064A\u0644",
      "wb.btn_save": "\u062D\u0641\u0638 \u0627\u0644\u0645\u0634\u0631\u0648\u0639",
      "wb.btn_share": "\u0645\u0634\u0627\u0631\u0643\u0629",
      "wb.btn_clear": "\u0645\u0633\u062D",
      "wb.btn_layout": "\u062A\u0631\u062A\u064A\u0628 \u062A\u0644\u0642\u0627\u0626\u064A \u0647\u0631\u0645\u064A",
      "wb.btn_zoom": "\u0645\u0644\u0627\u0621\u0645\u0629 \u0627\u0644\u0639\u0631\u0636",
      "wb.btn_add_part": "\u0625\u0636\u0627\u0641\u0629",
      "wb.palette_label": "\u0625\u0636\u0627\u0641\u0629 \u0645\u0643\u0648\u0646",
      "wb.help_mid": "\u{1F9E0} \u062A\u0631\u062A\u064A\u0628 \u0630\u0643\u064A (\u062A\u0631\u062A\u064A\u0628 \u0647\u0631\u0645\u064A \u062A\u0644\u0642\u0627\u0626\u064A)",
      "wb.help_line1": "\u{1F5B1}\uFE0F \u0627\u0646\u0642\u0631 \u0637\u0631\u0641\u064B\u0627 (\u064A\u0644\u0645\u0639) \u062B\u0645 \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u062B\u0627\u0646\u064A \u0644\u0631\u0633\u0645 \u0633\u0644\u0643",
      "wb.help_line2": "\u0646\u0642\u0631\u0629 \u0645\u0632\u062F\u0648\u062C\u0629 / \u0632\u0631 \u064A\u0645\u064A\u0646 \u0639\u0644\u0649 \u0633\u0644\u0643 \u0644\u062D\u0630\u0641\u0647",
      "wb.help_line3": "\u0627\u0633\u062D\u0628 \u0627\u0644\u0643\u0648\u0646 \u0645\u0646 \u0631\u0623\u0633\u0647\u0627",
      "wb.help_line4": "\u25B6\uFE0F \u0627\u0628\u062F\u0623 \u0627\u0644\u0645\u062D\u0627\u0643\u0627\u0629 \u062B\u0645 \u0627\u0646\u0642\u0631 \u0627\u0644\u0623\u0632\u0631\u0627\u0631 \u0644\u0644\u062A\u0628\u062F\u064A\u0644",
      "wb.help_line5": "\u0627\u0633\u062D\u0628 \u0627\u0644\u062E\u0644\u0641\u064A\u0629 \u0644\u0644\u062A\u062D\u0631\u064A\u0643\u060C \u0627\u0644\u0639\u062C\u0644\u0629/\u0627\u0644\u0642\u0631\u0635 \u0644\u0644\u062A\u0642\u0631\u064A\u0628",
      "wb.help_line6": "\u27F3 \u0644\u062A\u062F\u0648\u064A\u0631 \u0627\u0644\u0645\u0643\u0648\u0646",
      "wb.help_line7": "\u064A\u0639\u0645\u0644 \u0628\u0627\u0644\u0644\u0645\u0633 \u{1F4F1}",
      "wb.col_wire_red": "\u{1F534} \u0623\u062D\u0645\u0631 (+)",
      "wb.col_wire_black": "\u26AB \u0623\u0633\u0648\u062F (GND)",
      "wb.col_wire_orange": "\u{1F7E0} \u0628\u0631\u062A\u0642\u0627\u0644\u064A (\u062A\u0645\u0627\u0633)",
      "wb.col_wire_blue": "\u{1F535} \u0623\u0632\u0631\u0642 (+12V)",
      "wb.col_wire_green": "\u{1F7E2} \u0623\u062E\u0636\u0631 (\u0645\u0646\u0637\u0642)",
      "wb.col_wire_color_label": "\u0644\u0648\u0646 \u0627\u0644\u0633\u0644\u0643",
      "wb.sim_state_off": "\u0645\u062A\u0648\u0642\u0641",
      "wb.sim_state_on": "\u0627\u0644\u0645\u062D\u0627\u0643\u0627\u0629 \u062A\u0639\u0645\u0644 \u2014 \u0627\u0646\u0642\u0631 \u0627\u0644\u0623\u0632\u0631\u0627\u0631!",
      "wb.tier_eco": "\u0648\u0636\u0639 \u0627\u0642\u062A\u0635\u0627\u062F\u064A",
      "wb.tier_high": "\u0623\u062F\u0627\u0621 \u0639\u0627\u0644\u064D (60fps)",
      "wb.short_alert": "\u0645\u0627\u0633 \u0643\u0647\u0631\u0628\u0627\u0626\u064A \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0645\u062D\u0627\u0643\u0627\u0629! \u062A\u0648\u0642\u0641\u062A \u0627\u0644\u0645\u062D\u0627\u0643\u0627\u0629 \u0644\u0644\u062D\u0645\u0627\u064A\u0629 \u2014 \u0627\u0641\u0635\u0644 \u0627\u0644\u062A\u0645\u0627\u0633 \u0628\u064A\u0646 (+) \u0648 GND \u062B\u0645 \u0623\u0639\u062F \u0627\u0644\u062A\u0634\u063A\u064A\u0644.",
      "wb.valid_ok": "\u0644\u0627 \u0645\u0627\u0633 \u0645\u0643\u062A\u0634\u0641",
      "wb.valid_short": "\u0645\u0627\u0633 \u0643\u0647\u0631\u0628\u0627\u0626\u064A! \u0642\u0637\u0628 (+) \u0645\u062A\u0635\u0644 \u0645\u0628\u0627\u0634\u0631\u0629 \u0628\u0640 GND",
      "wb.valid_float": "\u0639\u0646\u0627\u0635\u0631 \u0644\u064A\u0633 \u0644\u0647\u0627 \u0633\u0644\u0643",
      "wb.save_local": "\u062D\u064F\u0641\u0638 \u0645\u062D\u0644\u064A\u064B\u0627",
      "wb.save_cloud": "\u062D\u064F\u0641\u0638 \u0641\u064A \u0627\u0644\u0633\u062D\u0627\u0628\u0629! +336Wh \u{1F331}",
      "wb.save_msg": "\u062C\u0627\u0631\u064D \u0627\u0644\u062D\u0641\u0638\u2026",
      "wb.save_no_parts": "\u0623\u0636\u0641 \u0645\u0643\u0648\u0646\u064B\u0627 \u0623\u0648\u0644\u064B\u0627!",
      "wb.share_copied": "\u0646\u064F\u0633\u062E \u0631\u0627\u0628\u0637 \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629!",
      "wb.share_need_save": "\u0627\u062D\u0641\u0638 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0623\u0648\u0644\u064B\u0627 \u0644\u0645\u0634\u0627\u0631\u0643\u062A\u0647!",
      "wb.clear_title": "\u0645\u0633\u062D \u0627\u0644\u0644\u0648\u062D\u0629 \u0628\u0627\u0644\u0643\u0627\u0645\u0644\u061F",
      "wb.load_fail": "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u2014 \u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0631\u0627\u0628\u0637",
      "wb.remix_box": "\u{1F374} \u062A\u0635\u0645\u064A\u0645 \u0644\u0644\u0635\u0627\u0646\u0639 \u2014 \u0639\u062F\u0651\u0644 \u0628\u062D\u0631\u064A\u0629 \u062B\u0645 \u0627\u062D\u0641\u0638 \u0644\u064A\u0646\u064F\u0634\u0631 \u0643\u0646\u0633\u062E\u0629 (Remix) \u0628\u0627\u0633\u0645\u0643.",
      "wb.demo_label": "PBX-36 starter",
      "wb.cloud_off": "\u0648\u0631\u0634\u0629 \u062F\u0648\u0646 \u0627\u062A\u0635\u0627\u0644",
      "wb.cloud_local": "\u0648\u0636\u0639 \u0645\u062D\u0644\u064A",
      "wb.cloud_cloud": "\u0627\u0644\u0633\u062D\u0627\u0628\u0629 \u0645\u0641\u0639\u0651\u0644\u0629",
      /* Voice AI */
      "vai.craft_title": "\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0645\u062E\u062A\u0628\u0631 \u0627\u0644\u0631\u0642\u0645\u064A",
      "vai.craft_sub": "\u0642\u0645 \u0628\u0623\u0648\u0631\u0648\u0628\u0642\u0627\u0642\u0629 \u062F\u0648\u0627\u0626\u0631\u0643 \u0628\u0627\u0644\u0645\u064A\u0643\u0631\u0648\u0641\u0648\u0646 \u062B\u0645 \u0639\u0644\u0649 \u0632\u0631",
      "vai.status_ready": "\u25CF \u062C\u0627\u0647\u0632 \u2014 \u0642\u0644 \xAB\u0623\u0636\u0641 \u0628\u0637\u0627\u0631\u064A\u0629\xBB",
      "vai.status_listen": "\u{1F3A4} Listening \u2014",
      "vai.status_read": "\u{1F4D6} Reading Canvas \u2014",
      "vai.mic_title": "\u062A\u062D\u062F\u062B",
      "vai.brain_title": "\u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0639\u0642\u0644 \u0627\u0644\u0645\u062D\u0644\u064A (\u0645\u0631\u0629 \u0648\u0627\u062D\u062F\u0629) \u2B07\uFE0F",
      "vai.prompt_pdf": "\u0645\u062E\u0637\u0637 PDF",
      "vai.form_hint": "\u0627\u0643\u062A\u0628 \u0623\u0648 \u062A\u062D\u062F\u062B: \u0623\u0636\u0641 MPPT\u2026",
      "vai.fab_hint": "\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0645\u062E\u062A\u0628\u0631 \u{1F3A7}",
      "vai.fab_aria": "\u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0635\u0648\u062A\u064A",
      "vai.save_keys": "\u{1F4BE} \u062D\u0641\u0638 \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D",
      "vai.keys_saved": "\u2705 \u062D\u064F\u0641\u0638\u062A \u0645\u062D\u0644\u064A\u064B\u0627!",
      "vai.collect_title": "\u062C\u0645\u0639 \u0627\u0644\u062C\u0647\u0627\u0632",
      "vai.collect_sub": "USB + GitHub: \u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0648\u0645\u0634\u0627\u0631\u0643\u0629 \u0645\u0634\u0631\u0648\u0639\u0643",
      "vai.publish_log": "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0646\u0634\u0631",
      /* Device sync */
      "ds.title": "\u0627\u0644\u0645\u0635\u0646\u0639 \u0648\u0627\u0644\u062A\u0635\u0645\u064A\u0645",
      "ds.sub": "US7 + GitHub: \u0634\u062D\u0646 \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u062C\u0647\u0632\u0629 RSIS",
      "ds.flash_title": "\u0648\u0634\u0628\u0643 \u0643\u0648\u062F \u0639\u0644\u0649 ESP32",
      "ds.flash_sub": "USB + GitHub: \u062A\u0634\u062E\u064A\u0635 \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0648\u0645\u0634\u0627\u0631\u0643\u0629 \u0645\u0634\u0631\u0648\u0639\u0643",
      "ds.flash_btn": "\u{1F525} \u062D\u0631\u0642 \u0627\u0644\u0643\u0648\u062F (Flash to Device)",
      "ds.gh_btn": "\u{1F419} \u0646\u0634\u0631 \u0639\u0644\u0649 GitHub",
      "ds.status_local": "USB + GitHub \u062C\u0627\u0647\u0632\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0635\u0641\u062D",
      /* Creator studio */
      "cs.title": "\u0627\u0633\u062A\u0648\u062F\u064A\u0648 \u0627\u0644\u062E\u0644\u0642",
      "cs.sub": "Ghost publications, YouTube videos, GitHub",
      "cs.blog": "\u062A\u062F\u0648\u064A\u0646\u0629 \u2014 \u064A\u0648\u0645",
      "cs.video": "\u0633\u064A\u062F\u0629 \u064A\u0643\u062A\u0628",
      "cs.keys": "\u0645\u0641\u0627\u062A\u064A\u062D",
      "cs.keys_save": "\u{1F4BE} \u062D\u0641\u0638 \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D",
      "cs.keys_saved": "\u2705 \u0645\u0641\u0627\u062A\u064A\u062D \u0627\u0644\u0645\u062D\u0641\u0648\u0638\u0629!",
      /* Swarm */
      "sw.title": "\u0627\u0644\u0645\u062C\u062A\u0645\u0639",
      "sw.sub": "\u0645\u0634\u0627\u0631\u064A\u0639 \u0627\u0644\u0635\u0627\u0646\u0639\u064A\u0646\u060C \u0623\u062F\u0648\u0627\u062A\u060C \u0623\u0641\u0643\u0627\u0631",
      "sw.empty": "\u0627\u0644\u0645\u062C\u062A\u0645\u0639 \u064A\u0628\u062F\u0623 \u0642\u0631\u064A\u0628\u0627\u064B \u2014 \u062C\u0631\u0628 \u062A\u0631\u0643\u064A\u0628\u064B \u0648\u0634\u0627\u0631\u0643\u0647\u0627!",
      "sw.search": "\u0627\u0628\u062D\u062B",
      "sw.loading": "\u062A\u062D\u0645\u064A\u0644\u2026",
      "sw.show_more": "\u0623\u0638\u0647\u0631 \u0627\u0644\u0645\u0632\u064A\u062F",
      "sw.show_less": "\u0623\u0642\u0644",
      /* Profile */
      "pr.title": ".profile",
      "pr.sub": "activities your Wattouna",
      "pr.empty": ".empty",
      "pr.logout": "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C",
      "pr.avatar": "\u0627\u0644\u0635\u0648\u0631\u0629",
      "pr.name": "\u0627\u0644\u0627\u0633\u0645",
      /* Footer */
      "ft.brand": "\u0648\u0627\u0637\u0646\u0627 energ\xEDa de Segunda vida, al norte.",
      "ft.nav_projects": "\u0627\u0644\u0645\u0634\u0627\u0631\u064A\u0639",
      "ft.nav_docs": "\u0627\u0644\u0648\u062B\u0627\u0626\u0642",
      "ft.nav_commit": "\u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0641\u064A \u0627\u0644\u062B\u0642\u0629 open-source",
      "ft.built_with": "\u0645\u064F\u0646\u0634\u0626 \u0628\u0645\u0633\u0627\u0639\u062F\u0629",
      "ft.contribute": "\u0633\u0627\u0647\u0645",
      "ft.community": "\u0627\u0644\u0645\u062C\u062A\u0645\u0639",
      "ft.platform": "offer platform",
      "ft.admin": "\u26D4 \u0644\u0648\u062D\u0629 \u0623\u062F\u0648\u0627\u062A",
      /* Common */
      "common.more": "\u0627\u0644\u0645\u0632\u064A\u062F",
      "common.less": "\u0623\u0642\u0644",
      "common.close": "\u0625\u063A\u0644\u0627\u0642",
      "common.back": "\u0639\u0648\u062F\u0629",
      "common.muted": "\u0645\u0643\u062A\u0648\u0628",
      "common.link": "\u0631\u0627\u0628\u0637",
      "common.copy": "\u0646\u0633\u062E",
      "common.copied": "\u062A\u0645 \u0627\u0644\u0646\u0633\u062E",
      "common.open_in_new_tab": "\u0641\u062A\u062D \u0641\u064A \u0627\u0644\u062A\u0628\u0648\u064A\u0628\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629"
    }
  },
  "fr": {
    name: "Fran\xE7ais",
    dir: "ltr",
    strings: {
      "nav.menu": "Menu",
      "nav.community": "Communaut\xE9",
      "nav.components": "Composants",
      "nav.about": "\xC0 propos",
      "nav.login": "Connexion",
      "nav.signup": "S'inscrire",
      "nav.becomeMaker": "Fabriquer un labo?",
      "nav.settings": "Param\xE8tres",
      "nav.volunteer": "Rejoindre",
      "brand.title": "Wattouna \u2014 \xC9nergie de r\xE9cup\xE9ration",
      "meta.title": "Plateforme Wattouna \u2014 \xC9nergie solaire et bricolage DIY",
      "meta.desc": "Plateforme open source pour l'\xE9nergie solaire DIY et la r\xE9cup\xE9ration de batteries. Projet PBX-36 : g\xE9n\xE9rateur solaire 36V \xE0 z\xE9ro d\xE9charge.",
      "brand.tagline": "\xC9nergie de r\xE9cup\xE9ration, au nord.",
      "wb.title": "Laboratoire \u2014 Planche de circuits des bricoleurs",
      "wb.kicker": "Laboratoire des bricoleurs \u2014 Maker Canvas",
      "wb.headline": "Assemblez votre circuit par glisser-d\xE9poser",
      "wb.help": "Cliquez sur une borne (clignote) puis sur la seconde pour tracer un fil. Double-clic/droit pour supprimer un fil. Glissez les composants par leur t\xEAte. \u25B6\uFE0F Lancez la simulation pour interagir. \u27F3 pour tourner. Fonctionne au tactile \u{1F4F1}",
      "wb.toolbar_name": "Nom du projet",
      "wb.toolbar_color": "Couleur du fil",
      "wb.color.red": "Rouge (+)",
      "wb.color.black": "Noir (GND)",
      "wb.color.orange": "Orange (Latched)",
      "wb.color.blue": "Bleu (+12V)",
      "wb.color.green": "Vert (Logique)",
      "wb.btn_simulation": "Lancer la simulation",
      "wb.btn_stop": "Arr\xEAter",
      "wb.btn_validate": "V\xE9rifier le circuit",
      "wb.btn_save": "Enregistrer",
      "wb.btn_share": "Partager",
      "wb.btn_clear": "Effacer",
      "wb.btn_layout": "Disposition auto (hi\xE9rarchique)",
      "wb.btn_zoom": "Ajuster la vue",
      "wb.btn_add_part": "Ajouter",
      "wb.palette_label": "Ajouter un composant",
      "wb.help_line1": "\u{1F5B1}\uFE0F Cliquez sur une borne (clignote) puis la seconde pour tracer un fil",
      "wb.help_line2": "Double-clic / clic droit pour supprimer un fil",
      "wb.help_line3": "Glissez les composants par leur t\xEAte",
      "wb.help_line4": "\u25B6\uFE0F Lancez la simulation puis cliquez sur les boutons",
      "wb.help_line5": "Glissez le fond pour vous d\xE9placer, molette/disque pour zoomer",
      "wb.help_line6": "\u27F3 pour tourner un composant",
      "wb.help_line7": "Fonctionne au tactile \u{1F4F1}",
      "wb.col_wire_red": "\u{1F534} Rouge (+)",
      "wb.col_wire_black": "\u26AB Noir (GND)",
      "wb.col_wire_orange": "\u{1F7E0} Orange (Latched)",
      "wb.col_wire_blue": "\u{1F535} Bleu (+12V)",
      "wb.col_wire_green": "\u{1F7E2} Vert (Logique)",
      "wb.col_wire_color_label": "Couleur du fil",
      "wb.sim_state_off": "En pause",
      "wb.sim_state_on": "Simulation en cours \u2014 cliquez sur les boutons!",
      "wb.tier_eco": "Mode \xE9conomie d'\xE9nergie",
      "wb.tier_high": "Hautes performances (60fps)",
      "wb.short_alert": "Court-circuit pendant la simulation! La simulation s'est arr\xEAt\xE9e pour votre s\xE9curit\xE9 \u2014 d\xE9connectez le court-circuit entre (+) et la masse puis relancez.",
      "wb.valid_ok": "Aucun court-circuit d\xE9tect\xE9",
      "wb.valid_short": "Court-circuit! La borne (+) est directement raccord\xE9e \xE0 la masse",
      "wb.valid_float": "Composants sans fil",
      "wb.save_local": "Enregistr\xE9 en local",
      "wb.save_cloud": "Enregistr\xE9 dans le cloud! +336Wh \u{1F331}",
      "wb.save_msg": "Enregistrement en cours\u2026",
      "wb.save_no_parts": "Ajoutez un composant d'abord!",
      "wb.share_copied": "Lien de partage copi\xE9!",
      "wb.share_need_save": "Enregistrez le projet d'abord pour le partager!",
      "wb.clear_title": "Effacer la plaque enti\xE8re?",
      "wb.load_fail": "Impossible de charger le projet \u2014 v\xE9rifiez le lien",
      "wb.remix_box": "\u{1F374} Conception de dans la brique \u2014 modifiez librement puis enregistrez pour publier une copie (Remix) \xE0 votre nom.",
      "wb.demo_label": "D\xE9butant PBX-36",
      "wb.cloud_off": "Mode d\xE9connect\xE9",
      "wb.cloud_local": "Mode local",
      "wb.cloud_cloud": "Cloud activ\xE9",
      "vai.craft_title": "Assistant labo vocal",
      "vai.craft_sub": "Concevez vos circuits par la voix, dans le labo",
      "vai.status_ready": "\u25CF Pr\xEAt \u2014 dites \xAB ajoute une batterie \xBB",
      "vai.status_listen": "\u{1F3A4} \xC9coute \u2014",
      "vai.status_read": "\u{1F4D6} Lecture canevas \u2014",
      "vai.mic_title": "Parler",
      "vai.brain_title": "T\xE9l\xE9charger l'esprit local (une seule fois) \u2B07\uFE0F",
      "vai.prompt_pdf": "PDF du sch\xE9ma",
      "vai.form_hint": "Tapez ou parlez: ajoute un MPPT\u2026",
      "vai.fab_hint": "Assistant labo \u{1F3A7}",
      "vai.fab_aria": "Assistant vocal du labo",
      "vai.save_keys": "\u{1F4BE} Enregistrer",
      "vai.keys_saved": "\u2705 Enregistr\xE9 localement!",
      "vai.collect_title": "Collecte",
      "vai.collect_sub": "USB + GitHub : d\xE9couvrir les appareils et partager votre projet",
      "vai.publish_log": "Journal de publication",
      "ds.title": "Usine et design",
      "ds.sub": "USB + GitHub : flasher les appareils et partager votre projet",
      "ds.flash_title": "Flasher le code sur un ESP32",
      "ds.flash_sub": "USB + GitHub : diagnostiquer les appareils et partager votre projet",
      "ds.flash_btn": "\u{1F525} Flasher le code (Flash vers l'appareil)",
      "ds.gh_btn": "\u{1F419} Publier sur GitHub",
      "ds.status_local": "USB + GitHub pr\xEAts dans le navigateur",
      "cs.title": "Studio cr\xE9atif",
      "cs.sub": "Publications Ghost, vid\xE9os YouTube, GitHub",
      "cs.blog": "Article \u2014",
      "cs.video": "Vid\xE9o",
      "cs.keys": "Cl\xE9s",
      "cs.keys_save": "\u{1F4BE} Enregistrer",
      "cs.keys_saved": "\u2705 Cl\xE9s enregistr\xE9es!",
      "sw.title": "Communaut\xE9",
      "sw.sub": "Projets des bricoleurs, outils, id\xE9es",
      "sw.empty": "La communaut\xE9 arrive bient\xF4t \u2014 essayez une configuration et partagez-la!",
      "sw.search": "Rechercher",
      "sw.loading": "Chargement\u2026",
      "sw.show_more": "Afficher plus",
      "sw.show_less": "Moins",
      "pr.title": "Profil",
      "pr.sub": "activit\xE9s de votre Wattouna",
      "pr.empty": "Vide",
      "pr.logout": "D\xE9connexion",
      "pr.avatar": "Photo",
      "pr.name": "Nom",
      "ft.brand": "Wattouna \u2014 \xE9nergie de seconde vie, au nord.",
      "ft.nav_projects": "Projets",
      "ft.nav_docs": "Documentation",
      "ft.nav_commit": "Contribuer au code open-source",
      "ft.built_with": "Construit avec",
      "ft.contribute": "Contribuer",
      "ft.community": "Communaut\xE9",
      "ft.platform": "plateforme",
      "ft.admin": "\u26D4 Tableau d'administration",
      "common.more": "Plus",
      "common.less": "Moins",
      "common.close": "Fermer",
      "common.back": "Retour",
      "common.muted": "Accentu\xE9",
      "common.link": "Lien",
      "common.copy": "Copier",
      "common.copied": "Copi\xE9",
      "common.open_in_new_tab": "Ouvrir dans un nouvel onglet"
    }
  },
  "en": {
    name: "English",
    dir: "ltr",
    strings: {
      "nav.menu": "Menu",
      "nav.community": "Community",
      "nav.components": "Components",
      "nav.about": "About",
      "nav.login": "Sign in",
      "nav.signup": "Sign up",
      "nav.becomeMaker": "Become a maker?",
      "nav.settings": "Settings",
      "nav.volunteer": "Volunteer",
      "brand.title": "Wattouna \u2014 Second-life Energy",
      "meta.title": "Wattouna platform \u2014 DIY solar energy & battery upcycling",
      "meta.desc": "Open-source platform for DIY solar energy and battery upcycling. Flagship: PBX-36 \u2014 zero-drain 36V solar generator.",
      "brand.tagline": "Second-life energy, up north.",
      "wb.title": "Workshop \u2014 Maker Canvas",
      "wb.kicker": "Maker Workshop \u2014 Maker Canvas",
      "wb.headline": "Build your circuit by dragging and wiring",
      "wb.help": "Click a terminal (glows) then the second to draw a wire. Double-click/right-click a wire to delete it. Drag components from their head. \u25B6\uFE0F Start the simulation then click buttons to toggle. \u27F3 to rotate a component. Works by touch \u{1F4F1}",
      "wb.toolbar_name": "Project name",
      "wb.toolbar_color": "Wire color",
      "wb.color.red": "Red (+)",
      "wb.color.black": "Black (GND)",
      "wb.color.orange": "Orange (Latched)",
      "wb.color.blue": "Blue (+12V)",
      "wb.color.green": "Green (Logic)",
      "wb.btn_simulation": "Start simulation",
      "wb.btn_stop": "Stop",
      "wb.btn_validate": "Inspect connections",
      "wb.btn_save": "Save project",
      "wb.btn_share": "Share",
      "wb.btn_clear": "Clear",
      "wb.btn_layout": "Auto-layout (hierarchical)",
      "wb.btn_zoom": "Fit view",
      "wb.btn_add_part": "Add",
      "wb.palette_label": "Add a component",
      "wb.help_line1": "\u{1F5B1}\uFE0F Click a terminal (glows) then the second to draw a wire",
      "wb.help_line2": "Double-click / right-click a wire to delete it",
      "wb.help_line3": "Drag components from their head",
      "wb.help_line4": "\u25B6\uFE0F Start the simulation then click buttons to toggle",
      "wb.help_line5": "Drag the background to pan, scroll/disk to zoom",
      "wb.help_line6": "\u27F3 to rotate a component",
      "wb.help_line7": "Works by touch \u{1F4F1}",
      "wb.col_wire_red": "\u{1F534} Red (+)",
      "wb.col_wire_black": "\u26AB Black (GND)",
      "wb.col_wire_orange": "\u{1F7E0} Orange (Latched)",
      "wb.col_wire_blue": "\u{1F535} Blue (+12V)",
      "wb.col_wire_green": "\u{1F7E2} Green (Logic)",
      "wb.col_wire_color_label": "Wire color",
      "wb.sim_state_off": "Paused",
      "wb.sim_state_on": "Simulating \u2014 click the buttons!",
      "wb.tier_eco": "Eco mode",
      "wb.tier_high": "High performance (60fps)",
      "wb.short_alert": "Short circuit during simulation! The simulation stopped for your safety \u2014 disconnect the short between (+) and GND, then restart.",
      "wb.valid_ok": "No short found",
      "wb.valid_short": "Short circuit! The (+) terminal is directly connected to GND",
      "wb.valid_float": "Components with no wire",
      "wb.save_local": "Saved locally",
      "wb.save_cloud": "Saved to the cloud! +336Wh \u{1F331}",
      "wb.save_msg": "Saving\u2026",
      "wb.save_no_parts": "Add a component first!",
      "wb.share_copied": "Share link copied!",
      "wb.share_need_save": "Save the project first to share it!",
      "wb.clear_title": "Clear the whole board?",
      "wb.load_fail": "Could not load the project \u2014 check the link",
      "wb.remix_box": "\u{1F374} Design by \u2014 modify freely then save to publish a copy (Remix) under your name.",
      "wb.demo_label": "PBX-36 starter",
      "wb.cloud_off": "Offline workshop",
      "wb.cloud_local": "Local mode",
      "wb.cloud_cloud": "Cloud enabled",
      "vai.craft_title": "Voice lab assistant",
      "vai.craft_sub": "Design circuits by voice, in the lab",
      "vai.status_ready": "\u25CF Ready \u2014 say \xAB add a battery \xBB",
      "vai.status_listen": "\u{1F3A4} Listening \u2014",
      "vai.status_read": "\u{1F4D6} Reading Canvas \u2014",
      "vai.mic_title": "Speak",
      "vai.brain_title": "Download the local brain (once) \u2B07\uFE0F",
      "vai.prompt_pdf": "Schematic PDF",
      "vai.form_hint": "Type or speak: add MPPT\u2026",
      "vai.fab_hint": "Lab assistant \u{1F3A7}",
      "vai.fab_aria": "Voice lab assistant",
      "vai.save_keys": "\u{1F4BE} Save",
      "vai.keys_saved": "\u2705 Saved locally!",
      "vai.collect_title": "Collect",
      "vai.collect_sub": "USB + GitHub: discover devices and share your project",
      "vai.publish_log": "Publish log",
      "ds.title": "Factory & design",
      "ds.sub": "USB + GitHub: flash devices and share your project",
      "ds.flash_title": "Flash code to ESP32",
      "ds.flash_sub": "USB + GitHub: discover devices and share your project",
      "ds.flash_btn": "\u{1F525} Flash code (Flash to Device)",
      "ds.gh_btn": "\u{1F419} Publish to GitHub",
      "ds.status_local": "USB + GitHub ready from the browser",
      "cs.title": "Creator studio",
      "cs.sub": "Ghost publications, YouTube videos, GitHub",
      "cs.blog": "Blog post \u2014",
      "cs.video": "Video",
      "cs.keys": "Keys",
      "cs.keys_save": "\u{1F4BE} Save",
      "cs.keys_saved": "\u2705 Keys saved!",
      "sw.title": "Community",
      "sw.sub": "Maker projects, tools, ideas",
      "sw.empty": "The community is starting soon \u2014 try a build and share it!",
      "sw.search": "Search",
      "sw.loading": "Loading\u2026",
      "sw.show_more": "Show more",
      "sw.show_less": "Less",
      "pr.title": "Profile",
      "pr.sub": "your Wattouna activities",
      "pr.empty": "Empty",
      "pr.logout": "Sign out",
      "pr.avatar": "Photo",
      "pr.name": "Name",
      "ft.brand": "Wattouna \u2014 second-life energy, up north.",
      "ft.nav_projects": "Projects",
      "ft.nav_docs": "Documentation",
      "ft.nav_commit": "Contribute to the open-source codebase",
      "ft.built_with": "Built with",
      "ft.contribute": "Contribute",
      "ft.community": "Community",
      "ft.platform": "platform",
      "ft.admin": "\u26D4 Admin panel",
      "common.more": "More",
      "common.less": "Less",
      "common.close": "Close",
      "common.back": "Back",
      "common.muted": "Muted",
      "common.link": "Link",
      "common.copy": "Copy",
      "common.copied": "Copied",
      "common.open_in_new_tab": "Open in new tab"
    }
  }
};
const DEFAULT_LOCALE = "ar-TN";
function t(key, locale) {
  const level = locale || DEFAULT_LOCALE;
  const dict = LANGS[level];
  if (!dict) return key;
  let cur = dict.strings;
  for (const seg of key.split(":")) {
    if (cur && typeof cur === "object" && key in cur) {
      cur = cur[seg];
    } else {
      return key;
    }
  }
  return typeof cur === "string" ? cur : key;
}
function currentLocale() {
  try {
    return localStorage.getItem("wattouna-locale") || DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}
function setLocale(locale, opts) {
  const root = opts?.target || document;
  root.documentElement.setAttribute("lang", locale);
  root.documentElement.setAttribute("dir", LANGS[locale].dir);
  try {
    localStorage.setItem("wattouna-locale", locale);
  } catch {
  }
  applyTranslations(root);
  try {
    const evt = new CustomEvent("wattouna:languagechange", { detail: { locale } });
    window.dispatchEvent(evt);
  } catch {
  }
}
const I18N_ATTR = "data-i18n";
const I18N_FALLBACK_ATTR = "data-i18n-fallback";
const I18N_ATTR_ATTR = "data-i18n-attr";
function applyTranslations(root) {
  const r = root || document;
  const missing = [];
  const walker = document.createTreeWalker(r, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (n) => NodeFilter.FILTER_ACCEPT
  });
  const seen = /* @__PURE__ */ new Set();
  while (walker.nextNode()) {
    const el = walker.currentNode;
    if (seen.has(el)) continue;
    seen.add(el);
    apply(el, missing);
  }
  if (root) {
    const docWalker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_ELEMENT, {
      acceptNode: () => NodeFilter.FILTER_ACCEPT
    });
    while (docWalker.nextNode()) {
      const el = docWalker.currentNode;
      if (seen.has(el)) continue;
      seen.add(el);
      apply(el, missing);
    }
    seen.clear();
  }
  return missing;
}
function apply(el, missing) {
  const key = el.getAttribute(I18N_ATTR);
  if (key) {
    const val = t(key, currentLocale());
    if (val === key) missing.push(key);
    setText(el, val);
  }
  const fb = el.getAttribute(I18N_FALLBACK_ATTR);
  if (fb && !el.textContent) setText(el, fb);
  const attr = el.getAttribute(I18N_ATTR_ATTR);
  if (attr) {
    const key2 = el.getAttribute(I18N_ATTR) || el.getAttribute(I18N_FALLBACK_ATTR);
    if (key2) {
      const v = t(key2, currentLocale());
      if (v !== key2) el.setAttribute(attr, v);
      else if (el.getAttribute(attr) === "") missing.push(key2);
    }
  }
}
function setText(el, v) {
  if (el.childNodes.length === 0) {
    el.textContent = v;
  } else if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    const input = el;
    if (input.value === "") input.value = v;
  }
}
function installSwitcher(container) {
  const doc = container instanceof Document ? container : null;
  let root = doc ? doc.documentElement : container;
  (root.querySelectorAll(".wlang-switch, #wlangSwitcher") || []).forEach((e) => e.remove());
  const btn = document.createElement("button");
  btn.id = "wlangSwitcher";
  btn.className = "wlang-switch";
  btn.setAttribute("aria-label", "Changer de langue");
  btn.setAttribute("title", "Changer de langue");
  const cur = currentLocale();
  renderSwitcher(btn, cur);
  container.appendChild(btn);
  btn.addEventListener("click", (e) => {
    const next = nextLocale(cur);
    setLocale(next);
    renderSwitcher(btn, next);
  });
  return btn;
}
function renderSwitcher(btn, locale) {
  const w = LANGS[locale];
  const flag = locale === "ar-TN" ? "\u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u{1F1F9}\u{1F1F3}" : locale === "fr" ? "FR \u{1F1EB}\u{1F1F7}" : "EN \u{1F1EC}\u{1F1E7}";
  btn.innerHTML = `<span class="wlang-label" title="${w.name}">${flag} ${w.name}</span>`;
  btn.dataset.locale = locale;
}
function nextLocale(locale) {
  const seq = ["ar-TN", "fr", "en"];
  const i = seq.indexOf(locale);
  return seq[(i + 1) % seq.length];
}
function bootstrapI18n(opts) {
  setLocale(currentLocale(), opts);
  if (opts?.container) installSwitcher(opts.container);
  try {
    window.dispatchEvent(new CustomEvent("wattouna:localeready", { detail: { locale: currentLocale() } }));
  } catch {
  }
}
const locales = Object.entries(LANGS).map(([locale, dict]) => ({
  locale,
  name: dict.name,
  dir: dict.dir
}));
export {
  DEFAULT_LOCALE,
  applyTranslations,
  bootstrapI18n,
  currentLocale,
  installSwitcher,
  locales,
  nextLocale,
  renderSwitcher,
  setLocale,
  t
};
