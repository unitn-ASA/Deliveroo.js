<script setup>
    
import { ref, onMounted, computed } from 'vue';

    /** @type {string} */
    const frontendCommitHash = __COMMIT_HASH__;

    /** @type {string} */
    const frontendPackageVersion = __PACKAGE_VERSION__;

    /** @type {import('vue').Ref<string>} */
    const backendCommitHash = ref("");

    /** @type {import('vue').Ref<string>} */
    const backendPackageVersion = ref("");

    /** @type {import('vue').Ref<{}>} */
    const backendHashCompare = ref({});

    const HOST = import.meta.env.VITE_SOCKET_IO_HOST || window.location.origin;

    onMounted (() => {

        fetch( HOST+'/api' )
        .then( res => res.json() )
        .then( data => {
            // console.log(data);
            backendCommitHash.value = data.commitHash;
            backendPackageVersion.value = data.packageVersion;
            fetch( `https://api.github.com/repos/unitn-asa/Deliveroo.js/compare/HEAD...${data.commitHash}` )
            .then( res => res.json() )
            .then( data => {
                backendHashCompare.value = data;
            } )
            .catch( err => {
                // console.error(err);
            } );
        } );
    
    })

    const toolTip = computed(() => {
        return `Server ${backendPackageVersion.value}, Webapp ${frontendPackageVersion}`;
    })

</script>

<template>
    <main class="text-sm text-left">

        <div class="tooltip tooltip-bottom tooltip-info" :data-tip="toolTip">

            Build
            <a v-bind:href="'https://github.com/unitn-ASA/Deliveroo.js/commit/'+backendCommitHash">
                {{backendCommitHash?.slice(0,7)}}
            </a>
            <span v-if="frontendCommitHash!=backendCommitHash">
                (UI
                <a v-bind:href="'https://github.com/unitn-ASA/Deliveroo.js/commit/'+frontendCommitHash">
                    {{frontendCommitHash?.slice(0,7)}}
                </a>
                )
            </span>

        </div>

        <div class="">
            <span v-if="backendHashCompare?.behind_by || backendHashCompare?.ahead_by">
                <span v-if="backendHashCompare?.behind_by">
                    {{backendHashCompare?.behind_by}} commit(s) behind
                </span>
                <span v-if="backendHashCompare?.ahead_by">
                    {{backendHashCompare?.ahead_by}} commit(s) ahead of
                </span>
                main
            </span>
            <span v-else-if="backendHashCompare?.url">
                Up to date with main
            </span>
            <span v-else class="tooltip tooltip-error" :data-tip="backendHashCompare.message">
                Cannot verify possible updates
            </span>
            
        </div>
        
    </main>
</template>

<style>
</style>