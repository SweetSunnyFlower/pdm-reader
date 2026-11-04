import {useNavigate} from 'react-router-dom';
import {useDocuments} from '../state/DocumentsContext';

function HomePage() {
    const navigate = useNavigate();
    const {openFiles, loading, error} = useDocuments();

    async function handleOpen() {
        const opened = await openFiles();
        if (opened) {
            navigate('/viewer');
        }
    }

    return (
        <main className="home-page soft-page">
            <div className="home-orb home-orb-one"/>
            <div className="home-orb home-orb-two"/>

            <header className="home-topbar">
                <div className="home-brand-mark">P</div>
                <div>
                    <div className="home-brand-title">PDM Reader</div>
                    <div className="home-brand-subtitle">PowerDesigner Visual Explorer</div>
                </div>
            </header>

            <section className="home-hero" aria-labelledby="home-title">
                <div className="hero-copy">
                    <span className="soft-chip hero-eyebrow">Soft ER Canvas for PowerDesigner</span>
                    <h1 id="home-title" className="hero-title">
                        把 PDM 模型变成可触摸的关系画布
                    </h1>
                    <p className="hero-subtitle">
                        打开一个或多个 PowerDesigner .pdm 文件，在柔和的可拖拽画布中查看表结构、字段、索引与外键关系。
                    </p>
                </div>

                <div className="hero-panel soft-card" aria-label="打开 PDM 文件">
                    <div className="hero-panel-inner soft-card-inset">
                        <div className="upload-glyph" aria-hidden="true">
                            <span>↑</span>
                        </div>
                        <button className="soft-button soft-button-primary open-pdm-button" onClick={handleOpen} disabled={loading}>
                            {loading ? '正在解析...' : '打开 PDM'}
                        </button>
                        <p className="upload-hint">支持一次选择多个 .pdm 文件，打开后进入查看器页面。</p>
                    </div>
                </div>

                {error && <div className="home-error soft-card-inset">{error}</div>}

                <div className="home-features" aria-label="核心能力">
                    <div className="feature-card soft-card">
                        <div className="feature-icon soft-card-inset">01</div>
                        <h2>多文件 Tab</h2>
                        <p>同时打开多个模型，保持每个文件的独立查看状态。</p>
                    </div>
                    <div className="feature-card soft-card">
                        <div className="feature-icon soft-card-inset">02</div>
                        <h2>外键关系画布</h2>
                        <p>表节点可拖拽，外键自动转成清晰的关系连线。</p>
                    </div>
                    <div className="feature-card soft-card">
                        <div className="feature-icon soft-card-inset">03</div>
                        <h2>字段详情</h2>
                        <p>快速查看字段、主键、索引、备注和引用映射。</p>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default HomePage;
