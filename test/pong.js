
exports.start = (props) => null;

exports.handle = (msg, sendMessage) => {
    console.log("recived: ", msg);
    return "pong";
};

exports.end = () => null; 