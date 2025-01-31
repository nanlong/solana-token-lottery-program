### 生成程序文件

```bash
 solana program dump -u m metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s tests/metaplex_token_metadata_program.so
```

### 执行本地测试节点

```bash
solana-test-validator --bpf-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s tests/metaplex_token_metadata_program.so --reset
```

### 执行测试

```bash
anchor test --skip-local-validator
```
