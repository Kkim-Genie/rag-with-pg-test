from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F

def load_model():
    # 모델 이름
    model_name = "ProsusAI/finbert"
    # 토크나이저와 모델 불러오기
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name)

    return tokenizer, model

def classification(tokenizer, model, title, content):
    labels = ['positive', 'neutral', 'negative']
    full_content = title + content

    inputs = tokenizer(full_content, return_tensors="pt", truncation=True, max_length=512)

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = F.softmax(logits, dim=1)[0]

    neutral_prob = probs[1].item()  # index 1이 neutral
    if neutral_prob >= 0.7:
        return neutral_prob, "neutral"
    else:
        return neutral_prob, "non-neutral"