### 为脚本添加权限

```bash
cd setup
chmod +x setup-local.sh
chmod +x start-validator.sh
```

### 生成程序文件

```bash
./setup-local.sh
```

### 执行本地测试节点

```bash
./start-validator.sh
```

### 新开一个终端执行测试

```bash
anchor test --skip-local-validator
```

### 参考资料

- [Verified Collections](https://developers.metaplex.com/token-metadata/collections)
