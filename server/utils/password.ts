import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

/**
 * Hashes a password with a random salt
 * @param password The password to hash
 * @returns The hashed password with salt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compares a supplied password with a stored hashed password
 * @param supplied The supplied password
 * @param stored The stored hashed password with salt
 * @returns True if passwords match, false otherwise
 */
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  // Check if the stored password has a salt
  if (!stored.includes('.')) {
    // If not hashed yet, just compare directly (for transition)
    return supplied === stored;
  }
  
  // Normal password comparison with salt
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}