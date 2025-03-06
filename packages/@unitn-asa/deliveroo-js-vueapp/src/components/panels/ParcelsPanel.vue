<script setup>
    
    import { ref, computed } from 'vue';
    import Modal from '@/components/modals/Modal.vue';
    import { connection } from '../../states/myConnection.js';

    const my_modal_3 = ref(null);

    async function removeParcel(parcel) {
        // console.log('removeParcel', parcel.id);
        const timeout = setTimeout( () => {
            // console.log('removeParcel FAIL', parcel.id);
            my_modal_3.value.showModal();
        }, 1000 );
        await connection.socket.emit( 'parcel', 'dispose', { id: parcel.id } );
        // console.log('removeParcel, emit dispose parcel', parcel.id);
        clearTimeout(timeout);
    }

</script>

<template>
    <main>

        <dialog ref="my_modal_3" id="my_modal_3" class="modal text-base-content">
            <div class="modal-box">
                <form method="dialog">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                </form>
                <h3 class="text-lg font-bold text-red-500">Action not permitted! Please login as admin.</h3>
                <p class="py-4">Press ESC key or click on ✕ button to close</p>
            </div>
        </dialog>
        
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