//
//  SocketViewController.swift
//  OnlineLectureChatToCommentScreen
//
//  Created by 藤井陽介 on 2020/10/29.
//

import UIKit
import FirebaseFirestore
import SocketIO

class SocketViewController: UIViewController {
    
    enum Section: Int, Hashable, CaseIterable {
        case main
    }
    
    struct Item: Hashable {
        let nickname: String?
        let content: String?
        let firebaseDocId: String?
        let updatedAt: Date?
        private let identifier: UUID = UUID()
    }
    
    @IBOutlet weak var collectionView: UICollectionView! {
        didSet {
            collectionView.backgroundColor = .systemGroupedBackground
            collectionView.collectionViewLayout = createLayout()
        }
    }
    @IBOutlet weak var roomTextField: UITextField!
    @IBOutlet weak var testTextField: UITextField!
    @IBOutlet weak var sendButton: UIButton!
    
    var selectedItem: ViewController.Item?
    var dataSource: UICollectionViewDiffableDataSource<Section, Item>!
    var items: [Item] = []
    var socket: SocketIOClient!
    var roomName: String = "OLS-Test"
    private let socketManager = SocketManager(socketURL: URL(string: "commentscreen.com")!,
                                              config: [.log(true), .compress, .reconnects(true), .reconnectWait(1000), .reconnectWaitMax(5000), .reconnectAttempts(100)])
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        if let item = selectedItem {
            testTextField.isHidden = true
            sendButton.isHidden = true
            configureNavItem(title: item.name ?? "Room")
        } else {
            configureNavItem(title: "Test")
        }
        configureDataSource()
        updateSnapshot()
        
        socket = socketManager.defaultSocket
        socket.on(clientEvent: .connect) { data, ack in
            print("Connected")
        }
        socket.on(clientEvent: .disconnect) { data, ack in
            print("Disconnected")
        }
        socket.connect()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        
        if let item = selectedItem {
            roomName = "OLS-" + (item.name ?? item.identifier)
            Firestore.firestore().collection("rooms/\(item.identifier)/chat").addSnapshotListener { [weak self] querySnapshot, error in
                guard let self = self,
                      let documents: [QueryDocumentSnapshot] = querySnapshot?.documents else {
                    return
                }
                
                let newItems = documents.map { (document: QueryDocumentSnapshot) in
                    return Item(nickname: document["nickname"] as? String, content: document["content"] as? String, firebaseDocId: document.documentID, updatedAt: (document["timestamp"] as? Timestamp)?.dateValue())
                }
                let diffItems: [Item] = newItems.compactMap { (element: Item) in
                    if self.items.filter({ $0.firebaseDocId == element.firebaseDocId }).count == 0 {
                        return element
                    }
                    return nil
                }
                self.sendItems(sendItems: diffItems)
                self.items = newItems
                self.updateSnapshot()
            }
        }
        roomTextField.text = roomName
    }
    
    @IBAction func tapRoomButton() {
        guard let text = roomTextField.text,
              !text.isEmpty else {
            return
        }
        roomName = text
    }
    
    
    @IBAction func tapSendMessage() {
        guard let text = testTextField.text,
              !text.isEmpty else {
            return
        }
        
        let newPost = Item(nickname: "Test", content: text, firebaseDocId: nil, updatedAt: Date())
        sendItems(sendItems: [newPost])
        items.append(newPost)
        updateSnapshot()
        testTextField.text = ""
    }
}

extension SocketViewController {
    struct Room: Codable {
        let room: String
    }
    
    struct Message: Codable {
        let position: String
        let size: String
        let color: String
        let text: String
        let uuid: String
        let date: String
        
        init(text: String, uuid: String, date: String) {
            self.text = text
            self.uuid = uuid
            self.date = date
            self.position = "opt_ue"
            self.size = "opt_small"
            self.color = "#190707"
        }
    }
    
    func generateUUID() -> String {
        var uuidArray = Array("xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx")
        for i in 0 ..< uuidArray.count {
            if uuidArray[i] == "x" {
                uuidArray[i] = Character(String(Int.random(in: 0..<16), radix: 16))
            } else if uuidArray[i] == "y" {
                uuidArray[i] = Character(String(Int.random(in: 0..<8), radix: 8))
            }
        }
        return uuidArray.reduce("", { $0 + String($1) })
    }
    
    func sendItems(sendItems: [Item]) {
        
        let room = Room(room: roomName)
        let jsonEncoder = JSONEncoder()
        let roomData = try! jsonEncoder.encode(room)
        let dateFormatter = DateFormatter()
        dateFormatter.timeStyle = .long
        dateFormatter.dateStyle = .full
        socket.emit("join", roomData) {
            for item in sendItems {
                let message = Message(text: item.content ?? "empty", uuid: self.generateUUID(), date: dateFormatter.string(from: Date()))
                let messageData = try! jsonEncoder.encode(message)
                self.socket.emit("message", messageData) {
                    print("send \(message)")
                }
            }
        }
    }
}

extension SocketViewController {
    func configureNavItem(title: String) {
        navigationItem.title = title
        navigationItem.largeTitleDisplayMode = .always
    }
    
    func createLayout() -> UICollectionViewLayout {
        let sectionProvider = { (sectionIndex: Int, layoutEnvironment: NSCollectionLayoutEnvironment) -> NSCollectionLayoutSection? in
            guard let sectionKind = Section(rawValue: sectionIndex) else { return nil }
            
            if sectionKind == .main {
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
            content.text = item.content
            content.secondaryText = item.nickname
            cell.contentConfiguration = content
        }
    }
    
    func configureDataSource() {
        dataSource = UICollectionViewDiffableDataSource<Section, Item>(collectionView: collectionView) { [weak self] (collectionView, indexPath, item) -> UICollectionViewCell? in
            guard let self = self,
                  let sectionKind = Section(rawValue: indexPath.section) else { return nil }
            
            if sectionKind == .main {
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
        dataSnapshot.append(items)
        dataSource.apply(dataSnapshot, to: .main, animatingDifferences: false)
    }
}
