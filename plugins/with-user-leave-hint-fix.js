const { withMainActivity } = require("@expo/config-plugins");

// RN 0.85's ReactActivityDelegate.onUserLeaveHint() calls Objects.requireNonNull on the
// React host. That host can be null while the activity is being torn down or while a
// dev-client reload is in flight, so the call throws a NullPointerException and crashes the
// app whenever it is "user-left" (home button / app switch). It can't be caught from JS, so
// we guard it natively: if there is no host, there is simply nothing to notify.
const ON_USER_LEAVE_HINT_OVERRIDE = `
  override fun onUserLeaveHint() {
    // Guard the RN 0.85 ReactActivityDelegate.onUserLeaveHint NullPointerException
    // (null React host during teardown / dev-client reload).
    try {
      super.onUserLeaveHint()
    } catch (error: NullPointerException) {
      // No host to notify; ignore.
    }
  }
`;

/**
 * Adds a guarded onUserLeaveHint() override to MainActivity so backgrounding the app
 * (home / app switch) doesn't crash with a NullPointerException on React Native 0.85.
 */
module.exports = function withUserLeaveHintFix(config) {
  return withMainActivity(config, (cfg) => {
    const main = cfg.modResults;

    if (main.language !== "kt") {
      throw new Error(
        "with-user-leave-hint-fix expects a Kotlin MainActivity (found " +
          main.language +
          ")."
      );
    }
    if (main.contents.includes("override fun onUserLeaveHint")) {
      return cfg; // already patched — idempotent across prebuilds
    }

    const lastBrace = main.contents.lastIndexOf("}");
    if (lastBrace === -1) {
      throw new Error(
        "with-user-leave-hint-fix could not find the MainActivity class body."
      );
    }

    main.contents =
      main.contents.slice(0, lastBrace) +
      ON_USER_LEAVE_HINT_OVERRIDE +
      main.contents.slice(lastBrace);

    return cfg;
  });
};
