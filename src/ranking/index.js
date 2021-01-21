import { sumBy, filter, orderBy } from "lodash";

class Ranking {
    constructor(db, options) {
        this.db = db;
        this.options = options;
    }

    sumPoint(items) {
        return sumBy(items, (item) => item.point);
    }

    getCreatedTotal(items) {
        let filtered = filter(items, (item) => item.event == 'created');
        return Object.keys(filtered).length;
    }
    
    getApprovedTotal(items) {
        let filtered = filter(items, (item) => item.event == 'approved');
        return Object.keys(filtered).length;
    }

    getRejectedTotal(items) {
        let filtered = filter(items, (item) => item.event == 'rejected');
        return Object.keys(filtered).length;
    }

    getCommentCreatedTotal(items) {
        let filtered = filter(items, (item) => item.event == 'comment_created');
        return Object.keys(filtered).length;
    }

    getCommentCreatedReplyTotal(items) {
        let filtered = filter(items, (item) => item.event == 'comment_created_reply');
        return Object.keys(filtered).length;
    }

    getFulfilledTotal(items) {
        let filtered = filter(items, (item) => item.event == 'fulfilled');
        return Object.keys(filtered).length;
    }

    getRejectedActorTotal(items) {
        let filtered = filter(items, (item) => item.event == 'rejected_actor');
        return Object.keys(filtered).length;
    }

    getUnapprovedTotal(items) {
        let filtered = filter(items, (item) => item.event == 'unapproved');
        return Object.keys(filtered).length;
    }

    getCommentDeletedTotal(items) {
        let filtered = filter(items, (item) => item.event == 'comment_deleted');
        return Object.keys(filtered).length;
    }

    getEngagementRate(approvedTotal, rejectedTotal, commentCreatedTotal, commentCreatedReplyTotal, prs_total, users_total) {
        let totais = (approvedTotal + rejectedTotal + commentCreatedTotal + commentCreatedReplyTotal) / prs_total;
        let rate = totais / users_total;
        return ( rate * 100);
    }

    getItemsByUser(user, items) {
        return filter(items, (item) => item.actor.uuid == user.uuid);
    }

    getPRs(items) {
        return filter(items, (item) => item.event == 'created');
    }

    getPRsTotal(items) {
        return Object.keys(this.getPRs(items)).length;
    }

    getDataUserForRanking(user, items, users_total) {
        let userItems = this.getItemsByUser(user, items);
        let points = this.sumPoint(userItems);

        let openPRsTotal = this.getCreatedTotal(userItems);
        let merges = this.getFulfilledTotal(userItems);
        let approvedTotal = this.getApprovedTotal(userItems);
        let rejectedTotal = this.getRejectedTotal(userItems);
        let commentCreatedTotal = this.getCommentCreatedTotal(userItems);
        let commentCreatedReplyTotal = this.getCommentCreatedReplyTotal(userItems);
        
        let prs_total = this.getPRsTotal(items);
        let engagementRate = this.getEngagementRate(
            approvedTotal,
            rejectedTotal,
            commentCreatedTotal,
            commentCreatedReplyTotal,
            prs_total,
            users_total
        );

        return {
            user,
            openPRsTotal,
            merges,
            approvedTotal,
            rejectedTotal,
            commentCreatedTotal,
            commentCreatedReplyTotal,
            points,
            engagementRate
        }
    }

    build() {
        let ref = this.db.ref(`${this.options.workspace}/${this.options.project}/${this.options.repository}`);
        let lines = [];
        const self = this;
        ref.on("value", function(snapshot) {
            const data = snapshot.val();
            const users = data.users;

            Object.keys(users).forEach((key) => {
                let line = self.getDataUserForRanking(users[key], data.ranking, Object.keys(users).length);
                lines.push(line);
            });

        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
        });

        return orderBy(lines, ['points'] , ['desc']);
    }
}

export default Ranking;