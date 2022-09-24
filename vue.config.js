const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true
})

module.exports = {
  css: {
    loaderOptions: {
      scss: {
//if not working, try with "additionalData" instead of "prependData"
          additionalData: `
            @import "@/assets/scss/variables.scss";
          `,
      },
    },
  },
};