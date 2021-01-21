const admin = require("firebase-admin");
const serviceAccount = require(__dirname + "/service-account.json");

class Database {
    constructor(databaseURL) {
        let fireApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: databaseURL
        });

        this.db = fireApp.database();
    }

    getFirebaseDatabase() {
        return this.db;
    }

    /**
     * Abrir PR - 15
     */
    toCreated(data) {
        this.saveUser(data, data.pullrequest.author);
        let values = this.buildObj('created', data.pullrequest.author, 15);
        this.save(data, values);
    }

    /**
     *  PR Aprovado - 15
     */
    toApproved(data) {
        this.saveUser(data, data.approval.user);
        let values = this.buildObj('approved', data.approval.user, 15);
        this.save(data, values);
    }

    /**
     * PR Recusado - 20
     */
    toRejected(data) {
        this.saveUser(data, data.actor);
        let values = this.buildObj('rejected', data.pullrequest.author, 20);
        this.save(data, values);
    }

    /**
     * Comentario - 20
     */
    toCommentCreated(data) {
        this.saveUser(data, data.comment.user);
        let values = this.buildObj('comment_created', data.comment.user, 20);
        this.save(data, values);
    }

    /**
     * Resposta - 10
     */
    toCommentCreatedReply(data) {
        this.saveUser(data, data.comment.user);
        let values = this.buildObj('comment_created_reply', data.comment.user, 10);
        this.save(data, values);
    }

    /**
     *  Merge - 35
     */
    toFulfilled(data) {
        this.saveUser(data, data.pullrequest.author);
        let values = this.buildObj('fulfilled', data.pullrequest.author, 35);
        this.save(data, values);
    }

    /**
     * PR Recusado - 15
     */
    toRejectedActor(data) {
        this.saveUser(data, data.pullrequest.author);
        let values = this.buildObj('rejected_actor', data.actor, -15);
        this.save(data, values);
    }

    /**
     * Remover Aprovação do PR - 15
     */
    toUnapproved(data) {
        this.saveUser(data, data.approval.user);
        let values = this.buildObj('unapproved', data.approval.user, -15);
        this.save(data, values);
    }

    /**
     * Excluir Comentario - 20
     */
    toCommentDeleted(data) {
        this.saveUser(data, data.comment.user);
        let values = this.buildObj('comment_deleted', data.comment.user, -20);
        this.save(data, values);
    }

    buildObj(event, user, point) {
        return {
            event: event,
            actor: user,
            point: point,
            created: new Date()
        };
    }

    save(data, values) {
        let workspace = data.repository.workspace.slug;
        let project = data.repository.project.uuid;
        let repository = data.repository.uuid;
    
        const ref = this.db.ref(`${workspace}/${project}/${repository}`);
        let repositoryRef = ref.child('ranking');
        repositoryRef.push().set(values);
    }

    saveUsersReviewers(data) {
        let workspace = data.repository.workspace.slug;
        let project = data.repository.project.uuid;
        let repository = data.repository.uuid;
    
        const ref = this.db.ref(`${workspace}/${project}/${repository}/users`);
        data.pullrequest.reviewers.forEach(user => {
            let repositoryRef = ref.child(`${user.uuid}`);
            repositoryRef.set(user);
        });
    }

    saveUser(data, user) {
        let workspace = data.repository.workspace.slug;
        let project = data.repository.project.uuid;
        let repository = data.repository.uuid;
    
        const ref = this.db.ref(`${workspace}/${project}/${repository}/users`);
        let repositoryRef = ref.child(`${user.uuid}`);
        repositoryRef.set(user);
    }
}

export default Database;