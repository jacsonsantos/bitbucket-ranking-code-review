import util from 'util';
import Database from '../src/database';
import Ranking from '../src/ranking';

export default function routes(app, addon) {
    const db = new Database("https://velvety-citizen-170618.firebaseio.com");
    
    app.get('/healthcheck', function(req, res) {
        res.send(200);
    });

    app.get('/', function (req, res) {
        res.format({
            // If the request content-type is text-html, it will decide which to serve up
            'text/html': function () {
                res.redirect('/atlassian-connect.json');
            },
            // This logic is here to make sure that the `atlassian-connect.json` is always
            // served up when requested by the host
            'application/json': function () {
                res.redirect('/atlassian-connect.json');
            }
        });
    });

    app.get('/connect-hub', addon.authenticate(), function (req, res) {
        let rankingObj = new Ranking(db.getFirebaseDatabase(), {
            workspace: req.query.workspace,
            project: req.query.project,
            repository: req.query.repository
        });

        let ranking = rankingObj.build();

        res.render('ranking', {
            lines: ranking
        });
    });

    app.post('/webhook', addon.authenticate(), function (req, res) {

        console.log(util.inspect(req.body, {
            colors:true,
            depth:null
        }));

        switch (req.body.event) {
            case "pullrequest:approved":
                db.toApproved(req.body.data);
                break;
            case "pullrequest:unapproved":
                db.toUnapproved(req.body.data);
                break;
            case "pullrequest:comment_created":
                if (req.body.data.comment.parent == undefined) {
                    db.toCommentCreated(req.body.data);
                } else {
                    db.toCommentCreatedReply(req.body.data);
                }
                break;
            case "pullrequest:comment_deleted":
                db.toCommentDeleted(req.body.data);
                break;
            case "pullrequest:created":
                db.toCreated(req.body.data);
                db.saveUsersReviewers(req.body.data);
                break;
            case "pullrequest:fulfilled":
                db.toFulfilled(req.body.data);
                break;
            case "pullrequest:rejected":
                db.toRejectedActor(req.body.data);
                if (data.pullrequest.author.uuid != data.actor.uuid) {
                    db.toRejected(req.body.data);
                }
                break;
        }

        res.send(204);
    });
};
