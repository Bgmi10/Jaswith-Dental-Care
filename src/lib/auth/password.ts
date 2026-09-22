import argon2 from "argon2";

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

export async function signPassword (password: string) {
  const hashPassword = await argon2.hash(password, {
    raw: false
  })

  console.log(hashPassword)
  return hashPassword.toString();
}