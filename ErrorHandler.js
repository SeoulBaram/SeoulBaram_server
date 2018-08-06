const expressValidation = require('express-validation');
const errors = require('./errors');

module.exports = (app) => {

    const error_code = {
        INVALID_PARAMETER: 9401,
        SERVER_ERROR: 500
    };

    app.use((err, req, res, next) => {

        console.log(`\n\x1b[31m[ERROR Handler] \u001b[0m \n\x1b[34m[Request PATH - ${req.path}] \u001b[0m\n`, err);

        let miss_param = false;

        //파라미터가 없을 때
        if (err instanceof expressValidation.ValidationError) {

            miss_param = err.errors.map(error => error.messages.join('. ')).join('\n');
            console.log(`\n\x1b[36m[Miss Params] \u001b[0m \n${miss_param}`);
            err = error_code.INVALID_PARAMETER;
        }

        //숫자로 정의되지 않은 에러코드가 넘어올 때
        else if (isNaN(err)) {

            err = error_code.SERVER_ERROR;
        }

        //에러 메세지 설정 - 미리정의된 숫자 입력시 조건문 없이 이 부분으로 온다.
        const response_error = errors[err];
        response_error.miss_param = miss_param ? miss_param : undefined;

        return res.status(response_error.status).json(
            response_error
        );
    });};