Showcase.vue
<script>
export default {
 data() {
   return {
     projects: [
       {
         title: "My first Project",
         desc: `Lorem ipsum  ...`,
         techs: ["PostgreSQL", "React", "Redux", "Node"],
         urlText: "Github",
         url: "https://github.com/maxfer03/solana-digital-nomads",
         img: "https://efectocolibri.com/wp-content/uploads/2021/01/placeholder.png",
       },
       {
         title: "My Second Project",
         desc: `Lorem ipsum  ...`,
         techs: ["PostgreSQL", "BLAAAAAAA", "Redux", "Node"],
         urlText: "Github",
         url: "https://github.com/maxfer03/solana-digital-nomads",
         img: "https://efectocolibri.com/wp-content/uploads/2021/01/placeholder.png",
       },
     ],
     index: 0,
   };
 },
 methods: {
   async next() {
     if (this.projects.length - 1 === this.index) {
       this.index = 0;
     } else {
       this.index++;
     }
   },
   async prev() {
     if (this.index === 0) {
       this.index = this.projects.length - 1;
     } else {
       this.index--;
     }
   },
 },
};
</script>