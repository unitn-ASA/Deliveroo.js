<script setup>

    import { ref, inject } from 'vue'
    import { connection } from '@/states/myConnection.js';
    import LevelCard from './LevelCard.vue';
    import Modal from './Modal.vue';
    import GameOptions from './GameOptions.vue';

    // @ts-ignore
    var HOST = import.meta.env.VITE_SOCKET_IO_HOST || window.location.origin;

    /** @type {import('vue').Ref<import('@unitn-asa/deliveroo-js-sdk/client').IOGameOptions[]>} */
    const levels = ref([]);

    const levelEditorModal = ref(false);
    const selectedLevelForEditor = ref({});
    /** @type {import('vue').Ref<HTMLInputElement|null>} */
    const fileInputRef = ref(null);

    function handleOpenGameOptions(levelData) {
        selectedLevelForEditor.value = levelData;
        levelEditorModal.value = true;
    }

    /**
     * @param {Event} event
     */
    function openFromJson(event) {
        const target = /** @type {HTMLInputElement} */ (event.target);
        const file = target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = e.target?.result;
                if (typeof result !== 'string') {
                    throw new Error('File result is not a string');
                }
                const jsonContent = JSON.parse(result);
                // Ensure the JSON has required structure
                const levelData = {
                    title: jsonContent.title || 'Imported Level',
                    description: jsonContent.description || 'Imported from local file',
                    ...jsonContent
                };
                handleOpenGameOptions(levelData);
            } catch (error) {
                alert('Error parsing JSON file: ' + error.message);
            }
        };
        reader.onerror = () => {
            alert('Error reading file');
        };
        reader.readAsText(file);

        // Reset the input so the same file can be selected again if needed
        if (target) {
            target.value = '';
        }
    }

    fetch(HOST + "/api/games")
    .then( res => res.json() )
    .then( data => {
        levels.value = data;
    })

    function exportMap() {
        const grid = connection.grid;
        const WIDTH = Array.from(grid.tiles.values()).reduce( (max, tile) => Math.max(max, tile.x), 0 ) + 1;
        const HEIGHT = Array.from(grid.tiles.values()).reduce( (max, tile) => Math.max(max, tile.y), 0 ) + 1;
        // const WIDTH = grid.width;
        // const HEIGHT = grid.height;
        const tiles = grid.tiles;
        const map = [];
        for ( let y=HEIGHT - 1; y>=0; y-- ) {
            let row = '';
            for ( let x=0; x<WIDTH; x++ ) {
                if ( tiles.has(x + y*1000) ) {
                    let tile = tiles.get( x + y*1000 );
                    let tileType = tile.type;

                    // Append '!' if there's a crate on this tile
                    const cratesOnTile = grid.getCratesAt( x, y );
                    if ( cratesOnTile && cratesOnTile.length > 0 ) {
                        tileType = tileType + '!';
                    }

                    row += String(tileType).padEnd(2, ' ');
                }
                else {
                    row += '0 ';
                }
            }
            map.push(row);
        }
        var string = JSON.stringify(map, null, 4);
        console.log( string );
        // copy into clipboard
        navigator.clipboard.writeText( string );
        alert( "Map copied to clipboard!" );
        return map;
    }

</script>

<template>

    <main class="p-4">
        <div class="w-full mx-auto pb-10">
            <!-- Header with Export and Import Buttons -->
            <div class="flex justify-between items-center mb-6 px-2">
                <h2 class="text-xl font-bold">Select a Game</h2>
                <div class="flex gap-2">
                    <input
                        ref="fileInputRef"
                        type="file"
                        accept=".json"
                        class="hidden"
                        @change="openFromJson"
                    />
                    <button class="btn btn-success btn-sm" @click="fileInputRef?.click()">
                        Import Json
                    </button>
                    <button class="btn btn-info btn-sm" @click="exportMap()">
                        Export Map
                    </button>
                </div>
            </div>

            <!-- Levels Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <!-- <LevelCard
                    v-model="connection.configs.GAME"
                /> -->
                <LevelCard
                    v-for="level of levels"
                    :key="level.title"
                    v-model="levels[levels.indexOf(level)]"
                    @openGameOptions="handleOpenGameOptions"
                />
            </div>
        </div>
    </main>

    <!-- Level Editor Modal (teleported to body for proper z-index stacking) -->
    <Teleport to="body">
        <Modal v-model="levelEditorModal" title="Level Editor" :z-index="50">
            <div class="p-4 space-y-4">
                <GameOptions v-model="selectedLevelForEditor"/>
            </div>
        </Modal>
    </Teleport>

</template>

<style scoped>
</style>
