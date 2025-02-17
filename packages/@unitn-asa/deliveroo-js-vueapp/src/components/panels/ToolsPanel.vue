<script setup>
    
    import { ref, computed } from 'vue';
    import { connection } from '../../states/myConnection.js';

    const grid = connection?.grid;
    const selectedAgent = grid?.selectedAgent;
    const selectedTile = grid?.selectedTile;
    const selectedParcel = grid?.selectedParcel;

    function change() {
        connection.socket.emit( 'tile', selectedTile.value.x, selectedTile.value.y );
    }

</script>

<template>
    <main>
            
        <span v-if="selectedTile">
            Tile in ({{ selectedTile?.x }}, {{ selectedTile?.y }})
            <div class="tooltip" data-tip="Click to change type">
                <button v-if="selectedTile" class="btn btn-error btn-sm" @click="change()">
                    Type {{ selectedTile?.type }}
                </button>
            </div>
        </span>

        <span v-if="selectedAgent">
            <br>
            Agent in ({{ selectedAgent?.x }}, {{ selectedAgent?.y }})
            is {{ selectedAgent?.name}} ( {{ selectedAgent?.id}} )
        </span>

        <span v-if="selectedParcel">
            <br>
            Parcel in ({{ selectedParcel?.x }}, {{  selectedParcel?.y }})
            is {{ selectedParcel?.id }} with reward {{ selectedParcel?.reward }}
        </span><br>

    </main>
</template>

<style>
</style>