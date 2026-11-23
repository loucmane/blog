import { constants } from 'node:fs'
import { open, type FileHandle } from 'node:fs/promises'
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  hkdfSync,
  randomBytes,
} from 'node:crypto'
import path from 'node:path'

export type BackupFailureCode =
  | 'invalid_configuration'
  | 'invalid_key_file'
  | 'tls_required'
  | 'invalid_manifest'
  | 'authentication_failed'
  | 'truncated_file'
  | 'checksum_mismatch'
  | 'missing_object'
  | 'operation_failed'

export class BackupError extends Error {
  constructor(readonly code: BackupFailureCode) {
    super(code)
  }
}

export const chunkBytes = 1024 * 1024
const nonceBytes = 12
const tagBytes = 16
const frameBytes = nonceBytes + tagBytes

export interface BackupFile {
  readonly bytes: number
  readonly sha256: string
  readonly encryptedBytes: number
  readonly encryptedSha256: string
}

async function openRegular(filename: string): Promise<FileHandle> {
  return open(filename, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)
}

export async function readBackupKey(filename: unknown): Promise<Buffer> {
  try {
    if (typeof filename !== 'string' || !path.isAbsolute(filename)) throw new Error()
    const file = await openRegular(filename)
    try {
      const stat = await file.stat()
      if (!stat.isFile() || (stat.mode & 0o7177) !== 0 || ![43, 44].includes(stat.size))
        throw new Error()
      const value = (await readExact(file, stat.size)).toString('latin1')
      await requireEnd(file)
      if (!/^[A-Za-z0-9_-]{43}\n?$/.test(value)) throw new Error()
      const encoded = value.slice(0, 43)
      const key = Buffer.from(encoded, 'base64url')
      if (key.length !== 32 || key.toString('base64url') !== encoded) throw new Error()
      return key
    } finally {
      await file.close()
    }
  } catch {
    throw new BackupError('invalid_key_file')
  }
}

export function backupKeys(key: Buffer, id: string) {
  if (key.length !== 32) throw new BackupError('invalid_key_file')
  return {
    files: Buffer.from(hkdfSync('sha256', key, id, 'magazine-backup-v1/files', 32)),
    manifest: Buffer.from(hkdfSync('sha256', key, id, 'magazine-backup-v1/manifest', 32)),
  }
}

export function manifestMac(key: Buffer, manifest: Buffer): Buffer {
  return createHmac('sha256', key).update(manifest).digest()
}

export function encryptedSize(bytes: number): number {
  return bytes + Math.max(1, Math.ceil(bytes / chunkBytes)) * frameBytes
}

export async function writePrivate(filename: string, data: Buffer): Promise<void> {
  const file = await open(filename, 'wx', 0o600)
  try {
    await file.writeFile(data)
    await file.sync()
  } finally {
    await file.close()
  }
}

async function readExact(file: FileHandle, size: number): Promise<Buffer> {
  const data = Buffer.alloc(size)
  let offset = 0
  while (offset < size) {
    const { bytesRead } = await file.read(data, offset, size - offset, null)
    if (bytesRead === 0) throw new BackupError('truncated_file')
    offset += bytesRead
  }
  return data
}

export async function readManifestFile(filename: string, limit: number): Promise<Buffer> {
  const file = await openRegular(filename)
  try {
    const stat = await file.stat()
    if (!stat.isFile() || stat.size > limit) throw new BackupError('invalid_manifest')
    const bytes = await readExact(file, stat.size)
    await requireEnd(file)
    return bytes
  } finally {
    await file.close()
  }
}

async function requireEnd(file: FileHandle): Promise<void> {
  if ((await file.read(Buffer.alloc(1), 0, 1, null)).bytesRead !== 0)
    throw new BackupError('checksum_mismatch')
}

function chunkIdentity(name: string, size: number, offset: number): Buffer {
  return Buffer.from(`${name}:${size}:${offset / chunkBytes}`)
}

export async function encryptBackupFile(
  directory: string,
  name: string,
  data: Uint8Array,
  key: Buffer,
): Promise<BackupFile> {
  const file = await open(path.join(directory, name), 'wx', 0o600)
  const ciphertextHash = createHash('sha256')
  try {
    for (let offset = 0; offset < Math.max(1, data.length); offset += chunkBytes) {
      const nonce = randomBytes(nonceBytes)
      const cipher = createCipheriv('aes-256-gcm', key, nonce, { authTagLength: tagBytes })
      cipher.setAAD(chunkIdentity(name, data.length, offset))
      const ciphertext = cipher.update(data.subarray(offset, offset + chunkBytes))
      const frame = Buffer.concat([nonce, ciphertext, cipher.final(), cipher.getAuthTag()])
      await file.writeFile(frame)
      ciphertextHash.update(frame)
    }
    await file.sync()
    return {
      bytes: data.length,
      sha256: createHash('sha256').update(data).digest('hex'),
      encryptedBytes: encryptedSize(data.length),
      encryptedSha256: ciphertextHash.digest('hex'),
    }
  } finally {
    await file.close()
  }
}

export async function authenticateBackupFile(
  directory: string,
  name: string,
  entry: BackupFile,
  key: Buffer,
  retain: boolean,
): Promise<Buffer> {
  const file = await openRegular(path.join(directory, name))
  const plaintextHash = createHash('sha256')
  const ciphertextHash = createHash('sha256')
  const data = Buffer.alloc(retain ? entry.bytes : 0)
  try {
    const stat = await file.stat()
    if (!stat.isFile()) throw new BackupError('invalid_manifest')
    if (stat.size < entry.encryptedBytes) throw new BackupError('truncated_file')
    if (stat.size !== entry.encryptedBytes) throw new BackupError('checksum_mismatch')
    for (let offset = 0; offset < Math.max(1, entry.bytes); offset += chunkBytes) {
      const frame = await readExact(file, frameBytes + Math.min(chunkBytes, entry.bytes - offset))
      const decipher = createDecipheriv('aes-256-gcm', key, frame.subarray(0, nonceBytes), {
        authTagLength: tagBytes,
      })
      decipher.setAAD(chunkIdentity(name, entry.bytes, offset))
      decipher.setAuthTag(frame.subarray(-tagBytes))
      const plaintext = decipher.update(frame.subarray(nonceBytes, -tagBytes))
      try {
        decipher.final()
      } catch {
        throw new BackupError('authentication_failed')
      }
      plaintextHash.update(plaintext)
      ciphertextHash.update(frame)
      if (retain) plaintext.copy(data, offset)
    }
    await requireEnd(file)
    if (
      plaintextHash.digest('hex') !== entry.sha256 ||
      ciphertextHash.digest('hex') !== entry.encryptedSha256
    )
      throw new BackupError('checksum_mismatch')
    return data
  } finally {
    await file.close()
  }
}
