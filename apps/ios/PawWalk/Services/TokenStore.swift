import Foundation
import Security

/// Tiny wrapper around the `Security` framework's Keychain APIs — no
/// third-party dependency needed for storing one access token.
///
/// Learning note: the Keychain API is C-flavored (CFDictionary in, OSStatus
/// out), which is why this looks so different from everything else in the
/// app. `enum` with `static` methods because there's no instance state — the
/// Keychain itself is the storage.
enum TokenStore {
    private static let service = "com.pawwalk.ios.auth"
    private static let account = "access_token"

    private static var query: [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
    }

    static func save(token: String) {
        clear()
        var item = query
        item[kSecValueData as String] = Data(token.utf8)
        SecItemAdd(item as CFDictionary, nil)
    }

    static func read() -> String? {
        var item = query
        item[kSecReturnData as String] = true
        item[kSecMatchLimit as String] = kSecMatchLimitOne

        var result: AnyObject?
        let status = SecItemCopyMatching(item as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func clear() {
        SecItemDelete(query as CFDictionary)
    }
}
