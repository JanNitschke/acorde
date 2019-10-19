

function test_prime(n) {
    if (n === 1 || n === 0) {
        return false;
    }
    else if (n === 2) {
        return true;
    }
    else {
        for (var x = 2; x < n; x++) {
            if (n % x === 0) {
                return false;
            }
        }
        return true;
    }
}

exports.handle = (msg, sendMessage) => {
    var primes = []
    for (let index = msg.from; index < msg.to; index++) {
        if(test_prime(index)) primes.push(index);
    }
    return primes;
};
