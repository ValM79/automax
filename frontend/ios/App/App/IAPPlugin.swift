import Foundation
import Capacitor
import StoreKit

// Bridges StoreKit 2 in-app purchases to the web layer for Place Ad's iOS
// checkout (Apple Guideline 3.1.1 — paid ad packages must go through IAP on
// iOS, not Stripe). The purchase itself happens entirely on-device via
// StoreKit; this plugin never decides whether a purchase is genuine or
// activates anything itself. It only reports a transaction ID back to
// JavaScript, which sends that ID to the backend's verifyAppleTransaction
// Lambda -- the actual trust boundary, which asks Apple's App Store Server
// API directly whether the transaction is real before activating the ad.
//
// A transaction is only finished (removed from StoreKit's redelivery queue)
// after that backend call succeeds -- see finishTransaction() below. If the
// app is killed before that, StoreKit keeps redelivering the transaction via
// Transaction.updates on future launches, so a purchase can never be silently
// lost even if the network call to our backend fails partway through.
@objc(IAPPlugin)
public class IAPPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "IAPPlugin"
    public let jsName = "IAPPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finishTransaction", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getProductPrice", returnType: CAPPluginReturnPromise)
    ]

    private let pendingStore = PendingTransactionStore()
    private var updateListenerTask: Task<Void, Never>?

    override public func load() {
        // Picks up transactions that complete outside a direct purchase() call
        // (e.g. Ask to Buy approval arriving later, or an unfinished transaction
        // left over from a previous launch that crashed before finishTransaction).
        updateListenerTask = Task.detached { [pendingStore, weak self] in
            for await result in Transaction.updates {
                guard case .verified(let transaction) = result else { continue }
                await pendingStore.set(String(transaction.id), transaction)
                self?.notifyListeners("transactionUpdated", data: [
                    "transactionId": String(transaction.id),
                    "productId": transaction.productID
                ])
            }
        }
    }

    deinit {
        updateListenerTask?.cancel()
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("productId is required")
            return
        }
        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.reject("Product not found: \(productId)")
                    return
                }
                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        await pendingStore.set(String(transaction.id), transaction)
                        call.resolve([
                            "transactionId": String(transaction.id),
                            "productId": transaction.productID
                        ])
                    case .unverified(_, let error):
                        call.reject("Purchase could not be verified on-device: \(error.localizedDescription)")
                    }
                case .userCancelled:
                    call.reject("userCancelled")
                case .pending:
                    // Needs approval (e.g. Ask to Buy) -- Transaction.updates
                    // will deliver it once approved; nothing more to do here.
                    call.reject("pending")
                @unknown default:
                    call.reject("Unknown purchase result")
                }
            } catch {
                call.reject("Purchase failed: \(error.localizedDescription)")
            }
        }
    }

    // Call only after the backend has verified the transaction with Apple and
    // activated the ad. This is what stops StoreKit from redelivering the same
    // transaction via Transaction.updates forever.
    @objc func finishTransaction(_ call: CAPPluginCall) {
        guard let transactionId = call.getString("transactionId") else {
            call.reject("transactionId is required")
            return
        }
        Task {
            guard let transaction = await pendingStore.get(transactionId) else {
                call.reject("Unknown transaction")
                return
            }
            await transaction.finish()
            await pendingStore.remove(transactionId)
            call.resolve()
        }
    }

    // Lets the Place Ad screen show Apple's actual localised price (which may
    // differ slightly from the Stripe price shown on web/Android) before the
    // user commits to a purchase.
    @objc func getProductPrice(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("productId is required")
            return
        }
        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.reject("Product not found: \(productId)")
                    return
                }
                call.resolve([
                    "productId": product.id,
                    "displayPrice": product.displayPrice,
                    "displayName": product.displayName
                ])
            } catch {
                call.reject("Failed to fetch product: \(error.localizedDescription)")
            }
        }
    }
}

// Thread-safe store for unfinished transactions, keyed by transaction ID as a
// String (StoreKit's UInt64 IDs don't round-trip cleanly through JS numbers,
// so everything crossing the JS bridge is a String). An actor rather than a
// plain dictionary because it's written from both the Transaction.updates
// listener task and individual purchase() calls concurrently.
actor PendingTransactionStore {
    private var transactions: [String: Transaction] = [:]

    func set(_ id: String, _ transaction: Transaction) {
        transactions[id] = transaction
    }

    func get(_ id: String) -> Transaction? {
        transactions[id]
    }

    func remove(_ id: String) {
        transactions.removeValue(forKey: id)
    }
}
