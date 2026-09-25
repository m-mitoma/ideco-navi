import './A8MatsuiAd.css'

// A8.net管理画面から取得した松井証券の広告タグ（007）。
// クリック・成果計測に影響するため、URL・パラメータ・計測用の1x1画像を含め
// 一切改変せず、そのままinnerHTMLとして出力する（JSXに書き換えない）。
const A8_MATSUI_AD_TAG = `<a href="https://px.a8.net/svt/ejp?a8mat=4BCHZN+6VOCFM+3XCC+BY641" rel="nofollow">
<img border="0" width="468" height="60" alt="" src="https://www29.a8.net/svt/bgt?aid=260923667416&wid=001&eno=01&mid=s00000018318002007000&mc=1"></a>
<img border="0" width="1" height="1" src="https://www19.a8.net/0.gif?a8mat=4BCHZN+6VOCFM+3XCC+BY641" alt="">`

function A8MatsuiAd() {
  return (
    <aside className="a8-ad" aria-label="広告">
      <p className="a8-ad-label">広告</p>
      <div className="a8-ad-tag" dangerouslySetInnerHTML={{ __html: A8_MATSUI_AD_TAG }} />
    </aside>
  )
}

export default A8MatsuiAd
