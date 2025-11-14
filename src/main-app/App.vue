

<template>

  <div id="app">
    <nav>
      <router-link to="/login">Login</router-link>
      <router-link to="/register">Register</router-link>
    </nav>
    <router-view />  </div>
</template>

<style >

/*
  nav { display: flex; gap: 10px; justify-content: center; margin-top: 20px; }
  a { text-decoration: none; color: #42b983; }
  a.router-link-active { font-weight: bold; }
*/

</style>
