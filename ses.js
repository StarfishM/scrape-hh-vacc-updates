const aws = require("aws-sdk");

let secrets =
    process.env.NODE_ENV == "production" ? process.env : require("./secrets");

const ses = new aws.SES({
    accessKeyId: secrets.AWS_KEY,
    secretAccessKey: secrets.AWS_SECRET,
    region: "eu-central-1",
});

exports.sendEmail = function (message, subject) {
    return ses
        .sendEmail({
            Source: `your check for hh vacc page<${secrets.NOTIFY}>`,
            Destination: {
                ToAddresses: [secrets.NOTIFY],
            },
            Message: {
                Body: {
                    Text: {
                        Data: message,
                    },
                },
                Subject: {
                    Data: subject,
                },
            },
        })
        .promise();
};
