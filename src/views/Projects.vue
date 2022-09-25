<template>
    <div class="proj-showcase">
        <div class="carousell">
            <button class="carousell-btns btn-back" @click="prev">{{ "<" }}</button>
                    <div class="carousell-content">
                        <img v-if="projects[index].img" :alt="projects[index].title + ' image'" class="carousell-img"
                            :src="projects[index].img" />

                        <div class="carousell-content-text">
                            <h3>{{ projects[index].title }}</h3>
                            <h4>
                                <span v-for="(tech, i) in projects[index].techs" :key="i">
                                    {{ tech }}{{ i === projects[index].techs.length - 1 ? "" : ", " }}
                                </span>
                            </h4>
                            <p>
                                {{ projects[index].desc }}
                            </p>
                            <a v-if="projects[index].url" :href="projects[index].url">{{
                            projects[index].urlText
                            }}</a>
                            <span v-else>{{ projects[index].urlText }}</span>
                        </div>
                    </div>
                    <button class="carousell-btns btn-next" @click="next">{{ ">" }}</button>
        </div>
    </div>
</template>
 
<script>
export default {};
</script>
 
<style lang="scss" scoped>
.projects-section {}
</style>