//
//  ViewController.swift
//  OnlineLectureChatToCommentScreen
//
//  Created by 藤井陽介 on 2020/10/29.
//

import UIKit
import FirebaseUI
import FirebaseAuth
import FirebaseFirestore

class ViewController: UIViewController {

    enum Section: Int, Hashable, CaseIterable {
        case main
        case test
    }

    struct Item: Hashable {
        let name: String?
        let identifier: String
    }
    
    @IBOutlet weak var collectionView: UICollectionView! {
        didSet {
            collectionView.backgroundColor = .systemGroupedBackground
            collectionView.collectionViewLayout = createLayout()
            collectionView.delegate = self
        }
    }

    var dataSource: UICollectionViewDiffableDataSource<Section, Item>!
    var items: [Item] = []
    private var handler: AuthStateDidChangeListenerHandle?
    private let socketSegueIdentifier = "toSocket"

    override func viewDidLoad() {
        super.viewDidLoad()

        configureNavItem()
        configureDataSource()
        updateSnapshot()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)

        handler = Auth.auth().addStateDidChangeListener { [weak self] (auth, user) in
            guard let self = self else { return }
            if user != nil {
                Firestore.firestore().collection("rooms").addSnapshotListener { [weak self] querySnapshot, error in
                    guard let self = self,
                          let documents: [QueryDocumentSnapshot] = querySnapshot?.documents else {
                        return
                    }

                    self.items = documents.map { (document: QueryDocumentSnapshot) in
                        return Item(name: document["name"] as? String, identifier: document.documentID)
                    }
                    self.updateSnapshot()
                }
            } else {
                let authUI = FUIAuth.defaultAuthUI()!
                authUI.delegate = self
                let providers: [FUIAuthProvider] = [
                    FUIGoogleAuth(),
                    FUIFacebookAuth(),
                    FUIOAuth.twitterAuthProvider(),
                    FUIOAuth.githubAuthProvider()
                ]
                authUI.providers = providers
                self.present(authUI.authViewController(), animated: true, completion: nil)
            }
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        Auth.auth().removeStateDidChangeListener(handler!)
        super.viewWillDisappear(animated)
    }

    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        if segue.identifier == socketSegueIdentifier {
            let viewController = segue.destination as! SocketViewController
            viewController.selectedItem = sender as? Item
        }
    }
}

extension ViewController {
    func configureNavItem() {
        navigationItem.largeTitleDisplayMode = .always
    }

    func createLayout() -> UICollectionViewLayout {
        let sectionProvider = { (sectionIndex: Int, layoutEnvironment: NSCollectionLayoutEnvironment) -> NSCollectionLayoutSection? in
            guard let sectionKind = Section(rawValue: sectionIndex) else { return nil }

            if sectionKind == .main || sectionKind == .test {
                return NSCollectionLayoutSection.list(using: .init(appearance: .insetGrouped), layoutEnvironment: layoutEnvironment)
            } else {
                fatalError("Unknown section")
            }
        }
        return UICollectionViewCompositionalLayout(sectionProvider: sectionProvider)
    }

    func configuredListCell() -> UICollectionView.CellRegistration<UICollectionViewListCell, Item> {
        return UICollectionView.CellRegistration<UICollectionViewListCell, Item> { (cell, indexPath, item) in
            var content = UIListContentConfiguration.valueCell()
            content.text = item.name
            cell.contentConfiguration = content
        }
    }

    func configureDataSource() {
        dataSource = UICollectionViewDiffableDataSource<Section, Item>(collectionView: collectionView) { [weak self] (collectionView, indexPath, item) -> UICollectionViewCell? in
            guard let self = self,
                  let sectionKind = Section(rawValue: indexPath.section) else { return nil }

            if sectionKind == .main || sectionKind == .test {
                return collectionView.dequeueConfiguredReusableCell(using: self.configuredListCell(), for: indexPath, item: item)
            } else {
                fatalError("Unknown section")
            }
        }
    }

    func updateSnapshot() {
        let sections = Section.allCases
        var snapshot = NSDiffableDataSourceSnapshot<Section, Item>()
        snapshot.appendSections(sections)
        dataSource.apply(snapshot, animatingDifferences: false)
        var dataSnapshot = NSDiffableDataSourceSectionSnapshot<Item>()
        var testSnapshot = NSDiffableDataSourceSectionSnapshot<Item>()

        dataSnapshot.append(items)
        testSnapshot.append([Item(name: "Test", identifier: "test")])

        dataSource.apply(dataSnapshot, to: .main, animatingDifferences: false)
        dataSource.apply(testSnapshot, to: .test, animatingDifferences: false)
    }
}

extension ViewController: UICollectionViewDelegate {
    func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
        guard let sectionKind = Section(rawValue: indexPath.section) else { return }

        if sectionKind == .main {
            performSegue(withIdentifier: socketSegueIdentifier, sender: items[indexPath.row])
        } else if sectionKind == .test {
            performSegue(withIdentifier: socketSegueIdentifier, sender: nil)
        } else {
            fatalError("Unknown section")
        }
    }
}

extension ViewController: FUIAuthDelegate {

}
