/**
 * electron-store stub for tests.
 * A simple in-memory key-value store that mimics the electron-store API.
 * Supports .clear() for resetting between tests.
 */
export default class MockStore {
  constructor() {
    this._d = {}
  }

  get(key) {
    return this._d[key]
  }

  set(key, value) {
    this._d[key] = value
  }

  delete(key) {
    delete this._d[key]
  }

  clear() {
    this._d = {}
  }

  has(key) {
    return Object.prototype.hasOwnProperty.call(this._d, key)
  }
}
