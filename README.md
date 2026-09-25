# 会社員向け iDeCo新制度ガイド

[![CI](https://github.com/m-mitoma/ideco-navi/actions/workflows/ci.yml/badge.svg)](https://github.com/m-mitoma/ideco-navi/actions/workflows/ci.yml)

## サイト概要

<p align="center">
  <img src="docs/overview/overview.png" alt="サイト概要" width="390">
</p>

## 開発工程

<p align="center">
  <img src="docs/development-process/development-process2.png" alt="開発工程" width="390">
</p>

## サイト構成

<p align="center">
  <img src="docs/site-structure/site-structure2.png" alt="サイト構成図" width="390">
</p>

## 主な機能

<p align="center">
  <img src="docs/features/features.png" alt="主な機能" width="390">
</p>

## 画面構成

本番サイト（<https://ideco-navi.vercel.app/>）で実際に公開・運用している画面です。各ページの下部には金融機関の選び方と広告を掲載しています。

### トップページ

<img src="./docs/images/home.png" alt="トップページ" width="100%">

iDeCoの概要と税制上のメリット・2026年12月の制度改正・会社員が確認すべきポイントをまとめたページです。

### 主なページ・機能

<table align="left">
  <tr>
    <td width="370" valign="top">
      <b>制度について（<code>/about</code>）</b><br><br>
      <img src="./docs/images/about.png" alt="制度について" width="370"><br><br>
      iDeCoの仕組みや加入条件・企業年金との関係・2026年12月の制度改正をくわしく解説するページです。
    </td>
  </tr>
</table>
<table align="right">
  <tr>
    <td width="370" valign="top">
      <b>掛金シミュレーター（<code>/contribution-simulator</code>）</b><br><br>
      <img src="./docs/images/contribution-simulator.png" alt="掛金シミュレーター" width="370"><br><br>
      年齢・年収・企業年金の状況・毎月の掛金を入力して拠出限度額の区分と2026年12月以降の目安を確認できるページです。
    </td>
  </tr>
</table>
<br clear="both">
<table align="left">
  <tr>
    <td width="370" valign="top">
      <b>退職所得控除シミュレーター（<code>/retirement-deduction</code>）</b><br><br>
      <img src="./docs/images/retirement-deduction.png" alt="退職所得控除シミュレーター" width="370"><br><br>
      iDeCoの開始年齢と受取予定年齢から退職所得控除額と一時金の課税対象額の目安を計算できるページです。
    </td>
  </tr>
</table>
<br clear="both">

## 使用技術

<p align="center">
  <img src="docs/tech-stack/tech-stack.png" alt="使用技術" width="390">
</p>

技術要素どうしの関係は以下の構成図の通りです。

<p align="center">
  <img src="docs/system-architecture/system-architecture.png" alt="システム構成図" width="390">
</p>

## CMS連携

<p align="center">
  <img src="docs/cms/cms.png" alt="CMS連携" width="390">
</p>

## 制作方針

<p align="center">
  <img src="docs/policy/policy.png" alt="制作方針" width="390">
</p>

## 制作における役割

企画・設計と確認を自分が担いClaude CodeなどのAIに実装を指示して制作しています。

<p align="center">
  <img src="docs/roles/roles.png" alt="制作における役割" width="390">
</p>

## 情報源

制度に関する情報は以下の公的な情報をもとに構成しています。

- 厚生労働省
- 国税庁
- iDeCo公式サイト（国民年金基金連合会）

## 注意事項

本サイトはiDeCoへの加入や掛金について個別の金融アドバイスを行うものではありません。

シミュレーション結果についても実際の加入条件や制度上の取扱いを確認するための参考情報として扱っています。

本サイトにはアフィリエイト広告（A8.net）を掲載しています。
