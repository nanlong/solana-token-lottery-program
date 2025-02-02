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

https://developers.metaplex.com/token-metadata/collections

[sb-randomness-on-demand](https://github.com/switchboard-xyz/sb-on-demand-examples/blob/main/sb-randomness-on-demand)

```
> Program logged: "Instruction: RandomnessReveal"
> Program invoked: System Program
  > Program returned success
> Program logged: "Randomness key: 6hDseTFid5wTL66dnJMwZh2FCM3skbfuYCb68fn8Sj98"
> Program logged: "Randomness seed slot hash: [195, 28, 65, 64, 48, 112, 198, 113, 138, 194, 139, 65, 39, 131, 41, 6, 218, 201, 234, 253, 132, 242, 53, 251, 254, 156, 10, 161, 85, 69, 46, 48]"
> Program logged: "Randomness seed slot: 1669"
> Program logged: "Randomness value: [12, 154, 173, 15, 113, 15, 128, 31, 153, 179, 57, 142, 158, 196, 236, 67, 118, 128, 11, 163, 229, 171, 201, 169, 165, 82, 92, 74, 205, 212, 152, 165]"
> Program logged: "Recovery ID: 1"
> Program logged: "AnchorError occurred. Error Code: InvalidSecpSignature. Error Number: 6016. Error Message: InvalidSecpSignature."
> Program consumed: 109416 of 142330 compute units
> Program returned error: "custom program error: 0x1780"
```
