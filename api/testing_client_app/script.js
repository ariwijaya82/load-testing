"use strict";

module.exports = {
  logEnv: function (context, event, done) {
    console.log(
      "Current environment is set to: ",
      context.vars.$environment || "dev"
    );
    done();
  },
};
