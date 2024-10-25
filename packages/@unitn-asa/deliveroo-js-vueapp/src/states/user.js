import { ref, reactive, watch } from 'vue';



const user = ref(
    // { token: '', payload: {} }
);
user.value = JSON.parse( localStorage.getItem('user') );
watch( user, (value) => {
    localStorage.setItem( 'user', JSON.stringify(value));
});



const myTokens = reactive(new Map());
if ( localStorage.getItem('myTokens') ) {
    for (const [token, payload] of JSON.parse( localStorage.getItem('myTokens') ) ) { // parse from array of entries
        myTokens.set(token, payload);
    }
}
watch( myTokens, (myTokens) => {
    localStorage.setItem( 'myTokens', JSON.stringify(Array.from(myTokens.entries()))); // stringify as array of entries
});

export { user, myTokens };