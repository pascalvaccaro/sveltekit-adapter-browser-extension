<script lang="ts">
  export let action = '/auth';
</script>

<form method="post" {action}>
  <label for="username">
    <p>Username</p>
    <input type="text" name="email" />
  </label>
  <label for="password">
    <p>Password</p>
    <input type="password" name="password" />
  </label>

  <input type="submit" value="Login" />
</form>

<style lang="scss">
  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 150px;
    min-width: 300px;
    max-width: 520px;
    padding: 2rem;
    border: 1px solid lightblue;
    border-radius: 1rem;
    box-shadow: 1px 1px 2px 2px lightblue;
    margin-bottom: 1rem;

    label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      p {
        margin: 0;
        padding: 0;
      }
    }
  }

  @media screen and (min-width: 520px) {
    form {
      flex-direction: row;
      justify-content: center;
      align-items: flex-end;
      min-height: 3rem;
      min-width: 80%;
      max-width: unset;
      width: 100%;

      input[type=submit] {
        height: 2rem;
      }
    }
  }
</style>