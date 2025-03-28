<script setup>
    
    import { ref, computed } from 'vue';

    /** @type {string} */
    const frontendCommitHash = __COMMIT_HASH__;
    
    /** @type {string} */
    const frontendPackageVersion = __PACKAGE_VERSION__;

    /** @type {import('vue').Ref<string>} */
    const backendCommitHash = ref("");

    /** @type {import('vue').Ref<string>} */
    const backendPackageVersion = ref("");
    
    const HOST = import.meta.env.VITE_SOCKET_IO_HOST || window.location.origin;

    fetch( HOST+'/api' )
    .then( res => res.json() )
    .then( data => {
        console.log(data);
        backendCommitHash.value = data.commitHash;
        backendPackageVersion.value = data.packageVersion;
    } );

</script>

<template>
    <main class="text-sm text-neutral-content">

            <div class="text-right w-80">
                Frontend
                v.<a v-bind:href="'https://www.npmjs.com/package/@unitn-asa/deliveroo-js-webapp/v/'+frontendPackageVersion">
                    {{ frontendPackageVersion }}
                </a>
                <a v-bind:href="'https://github.com/unitn-ASA/Deliveroo.js/commit/'+frontendCommitHash">
                    {{frontendCommitHash?.slice(0,7)}}
                </a>
            </div>

            <div class="text-right w-80">
                Server
                v. {{ backendPackageVersion }}
                <a v-bind:href="'https://github.com/unitn-ASA/Deliveroo.js/commit/'+backendCommitHash">
                    {{backendCommitHash?.slice(0,7)}}
                </a>
            </div>
        
    </main>
</template>

<style>
</style>