/*
 * Parser module
 *
 *   const parse = require('./parser');
 *
 *   parse(text)
 *       Returns the abstract syntax tree for the given program text. This
 *       function will first pre-parse (figure out indents and dedents),
 *       then match against an Ohm grammar, then apply AST generation
 *       rules. If there are any errors, this function will throw an error.
 */

const fs = require("fs");
const ohm = require("ohm-js");
const withIndentsAndDedents = require("./preparser.js");

const Program = require("../ast/program");
const WhileStatement = require("../ast/while-statement");
const IfStatement = require("../ast/if-statement");
const FromStatement = require("../ast/from-statement");
const BreakStatement = require("../ast/break-statement");
const ReturnStatement = require("../ast/return-statement");
const FunctionDeclaration = require("../ast/function-declaration");
const VariableDeclaration = require("../ast/variable-declaration");
const AssignmentStatement = require("../ast/assignment-statement");
const BinaryExpression = require("../ast/binary-expression");
const UnaryExpression = require("../ast/unary-expression");
const TernaryExpression = require("../ast/ternary-expression");
const ListType = require("../ast/list-type");
const ListExpression = require("../ast/list-expression");
const SetType = require("../ast/set-type");
const SetExpression = require("../ast/set-expression");
const DictType = require("../ast/dict-type");
const DictionaryExpression = require("../ast/dict-expression");
const KeyValueExpression = require("../ast/keyvalue-expression");
const Call = require("../ast/call");
const SubscriptedExpression = require("../ast/subscripted-expression");
const IdentifierExpression = require("../ast/identifier-expression");
const Parameter = require("../ast/parameter");
const Argument = require("../ast/argument");
const BooleanLiteral = require("../ast/boolean-literal");
const NumericLiteral = require("../ast/numeric-literal");
const StringLiteral = require("../ast/string-literal");
const IdDeclaration = require("../ast/identifier-declaration");
const { NumType, BooleanType, StringType } = require("../semantics/builtins");

const grammar = ohm.grammar(fs.readFileSync("./syntax/casper.ohm"));

// Ohm turns `x?` into either [x] or [], which we should clean up for our AST.
function arrayToNullable(a) {
  return a.length === 0 ? null : a[0];
}

/* eslint-disable no-unused-vars */
const astGenerator = grammar.createSemantics().addOperation("ast", {
  Program(_1, body, _2) {
    return new Program(body.ast());
  },
  Stmt_simple(statement, _) {
    return statement.ast();
  },
  Stmt_while(_, test, block) {
    return new WhileStatement(test.ast(), block.ast());
  },
  Stmt_if(_1, firstTest, firstBlock, _2, moreTests, moreBlocks, _3, lastBlock) {
    const tests = [firstTest.ast(), ...moreTests.ast()];
    const consequents = [firstBlock.ast(), ...moreBlocks.ast()];
    const alternate = arrayToNullable(lastBlock.ast());
    return new IfStatement(tests, consequents, alternate);
  },
  Stmt_loop(_1, id, _2, firstTest, _3, secondTest, _4, increments, Block) {
    const tests = [firstTest.ast(), secondTest.ast()];
    return new FromStatement(
      id.sourceString,
      tests,
      increments.ast(),
      Block.ast(),
    );
  },
  Stmt_ternary(trueTest, _1, test, _2, falseTest) {
    return new TernaryExpression(test.ast(), trueTest.ast(), falseTest.ast());
  },
  Stmt_function(type, id, _1, params, _2, block) {
    return new FunctionDeclaration(
      type.ast(),
      id.ast(),
      params.ast(),
      block.ast(),
    );
  },
  SimpleStmt_vardecl(t, v, _, e) {
    return new VariableDeclaration(t.ast(), v.ast(), e.ast());
  },
  SimpleStmt_assign(v, _, e) {
    return new AssignmentStatement(v.ast(), e.ast());
  },
  SimpleStmt_break(_) {
    return new BreakStatement();
  },
  SimpleStmt_return(_, e) {
    return new ReturnStatement(arrayToNullable(e.ast()));
  },
  Block_small(_1, statement, _2) {
    return [statement.ast()];
  },
  Block_large(_1, _2, _3, statements, _4) {
    return statements.ast();
  },
  Exp_or(left, op, right) {
    return new BinaryExpression(op.ast(), left.ast(), right.ast());
  },
  Exp_and(left, op, right) {
    return new BinaryExpression(op.ast(), left.ast(), right.ast());
  },
  Exp1_binary(left, op, right) {
    return new BinaryExpression(op.ast(), left.ast(), right.ast());
  },
  Exp2_binary(left, op, right) {
    return new BinaryExpression(op.ast(), left.ast(), right.ast());
  },
  Exp3_binary(left, op, right) {
    return new BinaryExpression(op.ast(), left.ast(), right.ast());
  },
  Exp4_unary(op, operand) {
    return new UnaryExpression(op.ast(), operand.ast());
  },
  Exp5_parens(_1, expression, _2) {
    return expression.ast();
  },
  Exp5_list(_1, expressions, _2) {
    return new ListExpression(expressions.ast());
  },
  Exp5_set(_1, _2, expressions, _3) {
    return new SetExpression(expressions.ast());
  },
  Exp5_dict(_1, expressions, _2) {
    return new DictionaryExpression(expressions.ast());
  },
  KeyValue(id, _, exp) {
    return new KeyValueExpression(id.ast(), exp.ast());
  },
  Call(callee, _1, expressions, _2) {
    return new Call(callee.ast(), expressions.ast());
  },
  VarExp_subscripted(v, _1, e, _2) {
    return new SubscriptedExpression(v.ast(), e.ast());
  },
  VarExp_simple(id) {
    return new IdentifierExpression(id.ast());
  },
  Param(type, id, _, exp) {
    return new Parameter(type.ast(), id.ast(), arrayToNullable(exp.ast()));
  },
  Arg(exp) {
    return new Argument(exp.ast());
  },
  DeclId(id) {
    return new IdDeclaration(id.ast());
  },
  NumType(_) {
    return NumType;
  },
  StringType(_) {
    return StringType;
  },
  BooleanType(_) {
    return BooleanType;
  },
  ListType(_1, type, _2) {
    return new ListType(type.ast());
  },
  SetType(_1, type, _2) {
    return new SetType(type.ast());
  },
  DictType(_1, keyType, _2, valueType, _3) {
    return new DictType(keyType.ast(), valueType.ast());
  },
  NonemptyListOf(first, _, rest) {
    return [first.ast(), ...rest.ast()];
  },
  EmptyListOf() {
    return [];
  },
  boollit(_) {
    return new BooleanLiteral(this.sourceString === "true");
  },
  numlit(_1, _2, _3, _4, _5, _6) {
    return new NumericLiteral(+this.sourceString);
  },
  strlit(_1, chars, _6) {
    return new StringLiteral(this.sourceString);
  },
  id(_1, _2) {
    return this.sourceString;
  },
  _terminal() {
    return this.sourceString;
  },
});
/* eslint-enable no-unused-vars */

/* eslint-disable no-console */
module.exports = (text) => {
  const match = grammar.match(withIndentsAndDedents(text));
  if (!match.succeeded()) {
    throw new Error(`Syntax Error: ${match.message}`);
  }
  // NOTE: uncomment if needed
  // console.log(JSON.stringify(astGenerator(match).ast()));
  return astGenerator(match).ast();
};
