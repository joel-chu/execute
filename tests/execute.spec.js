const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);
const expect = chai.expect;

const { execute, pipe } = require('../built');

describe('# execute tests', () => {
    describe('# Usages without errors', () => {
        it('# should execute a simple command', () =>
            execute('echo hello')
                .then(result => expect(result).to.equal('hello'))
        );

        it('# should execute a pipe command', () =>
            execute('echo "hello\nto you\nand me"')
                .then(pipe('grep o'))
                .then(result => expect(result).to.equal('hello\nto you'))
        );

        describe(' # environment variables tests', () => {
            beforeEach(() => {
                process.env.TEST_VAR = "hello";
            });

            afterEach(() => {
                delete process.env.TEST_VAR;
            });

            it('# should support setting environment variables', () =>
                execute('echo $INPUT', {env: {INPUT: 'hello'}})
                    .then(result => expect(result).to.equal('hello'))
            );

            it('# should have existing environment variables accessible', () =>
                execute('echo $TEST_VAR')
                    .then(result => expect(result).to.equal('hello'))
            );

            it('# should override existing environment variable if requested', () =>
                execute('echo $TEST_VAR', {env: {TEST_VAR: 'goodbye'}})
                    .then(result => expect(result).to.equal('goodbye'))
            );
        });
    });

    describe('# Usages resulting in errors', () => {
        it('# should fail when executing a command that results in non zero exit code', () =>
            execute('wc -l fileDoesNotExist.txt').should.be.rejected,
        );

        it('# should fail when a command in a pipe chain return a non zero exit code', () =>
            execute('echo a | grep b | echo c').should.be.rejected,
        );

        it('# should fail when a using an unset variable', () =>
            execute('echo $I_AM_NOT_SET').should.be.rejected,
        );

        it('# should return an error object with expected properties', () =>
            execute('echo a | grep b')
                .catch(error => {
                    expect(error.code).to.equal(1);
                    expect(error.cmd).to.include('echo a | grep b');
                    expect(error.stdout).to.exist;
                    expect(error.stderr).to.exist;
                })
        );
    });
});
