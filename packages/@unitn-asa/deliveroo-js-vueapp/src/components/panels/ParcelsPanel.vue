<script setup>
    
    import { ref, computed } from 'vue';
    import { connection } from '../../states/myConnection.js';

    function removeParcel(parcel) {
        // console.log('removeParcel', parcel.id);
        connection.socket.emit( 'dispose parcel', parcel.id );
    }

</script>

<template>
    <main>
        
        <table>
            <thead>
                <tr>
                    <th class="px-2"></th>
                    <th class="px-2">Parcel</th>
                    <th class="px-2">Reward</th>
                    <th class="px-2"></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="[key, parcel] in connection?.grid.parcels.entries()" class="text-center" @mouseover="parcel.hoovered=true" @mouseleave="parcel.hoovered=false">
                    <td class="p-0">
                        <input type="checkbox" v-model="parcel.selected" :checked="parcel.selected" class="checkbox checkbox-info" />
                    </td>
                    <td>
                        <div class="tooltip" :data-tip="parcel.x+','+parcel.y">
                            <span class="font-mono text-sm mx-auto" :class="{ 'font-medium': parcel.selected, 'font-bold': parcel.hoovered }">
                                {{ parcel.id }}
                            </span>
                        </div>
                    </td>
                    <td>
                        <span class="text-xl text-white ml-1">
                            {{ parcel.reward }}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-outline btn-error btn-xs" @click="removeParcel(parcel)">
                            X
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>

    </main>
</template>

<style>
</style>